"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function DashboardPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { socket, connected } = useSocket();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { type: 'user'|'room', id }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/chat/users`, { headers })
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
    fetch(`${API_BASE}/chat/rooms`, { headers })
      .then((r) => r.json())
      .then(setRooms)
      .catch(() => {});
  }, [isAuthenticated, headers]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    const onSystem = (evt) => {
      // noop for now
      console.log("system", evt);
    };
    socket.on("message", onMessage);
    socket.on("system", onSystem);
    return () => {
      socket.off("message", onMessage);
      socket.off("system", onSystem);
    };
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async (item) => {
    setActiveChat(item);
    // join room if room
    if (item.type === "room" && socket) socket.emit("join", item.id);
    // load history
    const params = new URLSearchParams();
    if (item.type === "user") params.set("withUserId", item.id);
    if (item.type === "room") params.set("roomId", item.id);
    const history = await fetch(`${API_BASE}/chat/messages?${params.toString()}`, { headers }).then((r) => r.json());
    setMessages(history);
  };

  const send = () => {
    if (!socket || !input.trim() || !activeChat) return;
    const payload = activeChat.type === "user"
      ? { content: input.trim(), toUserId: activeChat.id }
      : { content: input.trim(), roomId: activeChat.id };
    socket.emit("message", payload, (ack) => {
      if (ack?.ok && ack.message) setMessages((prev) => [...prev, ack.message]);
    });
    setInput("");
  };

  const typing = (isTyping) => {
    if (!socket || !activeChat) return;
    if (activeChat.type === "user") socket.emit("typing", { toUserId: activeChat.id, isTyping });
    if (activeChat.type === "room") socket.emit("typing", { roomId: activeChat.id, isTyping });
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] m-4 border rounded overflow-hidden">
      <aside className="w-64 border-r overflow-y-auto">
        <div className="p-2 font-semibold">Users</div>
        {users.filter(u => u._id !== user?._id).map((u) => (
          <button key={u._id} onClick={() => openChat({ type: 'user', id: u._id })} className={`block w-full text-left px-3 py-2 hover:bg-gray-100 ${activeChat?.type==='user'&&activeChat?.id===u._id?'bg-gray-100':''}`}>
            {u.name || u.email}
          </button>
        ))}
        <div className="p-2 font-semibold">Rooms</div>
        {rooms.map((r) => (
          <button key={r._id} onClick={() => openChat({ type: 'room', id: r._id })} className={`block w-full text-left px-3 py-2 hover:bg-gray-100 ${activeChat?.type==='room'&&activeChat?.id===r._id?'bg-gray-100':''}`}>
            {r.name}
          </button>
        ))}
      </aside>
      <main className="flex-1 flex flex-col">
        <div className="p-2 border-b text-sm text-gray-600">{connected ? "Connected" : "Disconnected"}</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div key={m._id} className={`max-w-[70%] p-2 rounded ${m.sender===user?._id? 'bg-blue-100 ml-auto':'bg-gray-100'}`}>
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); typing(true); }}
            onBlur={() => typing(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type a message"
          />
          <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
        </div>
      </main>
    </div>
  );
}


