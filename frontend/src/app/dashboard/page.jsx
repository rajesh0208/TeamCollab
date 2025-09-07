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
  const [typingUsers, setTypingUsers] = useState({}); // { userId: boolean }
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
      setMessages((prev) => (prev.find((m) => m._id === msg._id) ? prev : [...prev, msg]));
    };
    const onTyping = (evt) => {
      if (!evt?.userId || activeChat?.type !== 'user' && activeChat?.type !== 'room') return;
      // Show typing if relevant to current chat context
      if (activeChat?.type === 'user') {
        if (evt.userId === activeChat.id) setTypingUsers((p) => ({ ...p, [evt.userId]: evt.isTyping }));
      } else if (activeChat?.type === 'room') {
        setTypingUsers((p) => ({ ...p, [evt.userId]: evt.isTyping }));
      }
    };
    const onSystem = (evt) => {
      // noop for now
      console.log("system", evt);
    };
    socket.on("message", onMessage);
    socket.on("typing", onTyping);
    socket.on("system", onSystem);
    return () => {
      socket.off("message", onMessage);
      socket.off("typing", onTyping);
      socket.off("system", onSystem);
    };
  }, [socket, activeChat]);

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
    // Let the server broadcast the created message; avoid double-adding
    socket.emit("message", payload);
    setInput("");
  };

  const typing = (isTyping) => {
    if (!socket || !activeChat) return;
    if (activeChat.type === "user") socket.emit("typing", { toUserId: activeChat.id, isTyping });
    if (activeChat.type === "room") socket.emit("typing", { roomId: activeChat.id, isTyping });
  };

  return (
    <div className="h-[100vh] w-full bg-gray-50">
      <div className="mx-auto max-w-[1200px] h-full p-6">
        <div className="h-full bg-white border rounded-xl overflow-hidden grid grid-cols-[260px_1fr_300px]">
          {/* Sidebar */}
          <aside className="border-r h-full flex flex-col">
            <div className="px-4 py-4 border-b flex items-center gap-3">
              <div className="size-10 rounded-full bg-gray-200" />
              <div>
                <div className="font-medium">{user?.name || user?.email || 'User'}</div>
                <div className="text-xs text-green-600">● Online</div>
              </div>
            </div>
            <nav className="px-2 py-3 space-y-1">
              {[
                { label: 'Home', icon: '🏠' },
                { label: 'Tasks', icon: '🗂️' },
                { label: 'Notes', icon: '📝' },
                { label: 'Settings', icon: '⚙️' },
              ].map((i) => (
                <div key={i.label} className={`flex items-center gap-3 px-3 py-2 rounded-md ${i.label==='Home' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
                  <span>{i.icon}</span>
                  <span>{i.label}</span>
                </div>
              ))}
            </nav>
            <div className="px-4 pt-4 text-sm text-gray-500">Channels</div>
            <div className="px-2 pb-4 space-y-1">
              {rooms.map((r) => (
                <button key={r._id} onClick={() => openChat({ type: 'room', id: r._id })} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 ${activeChat?.type==='room'&&activeChat?.id===r._id?'bg-gray-100 font-medium':''}`}>
                  <span>#</span>
                  <span>{r.name}</span>
                </button>
              ))}
            </div>
            <div className="px-4 pt-2 text-sm text-gray-500">Messages</div>
            <div className="px-2 pb-4 space-y-1 overflow-y-auto">
              {users.filter(u => u._id !== user?._id).map((u) => (
                <button key={u._id} onClick={() => openChat({ type: 'user', id: u._id })} className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 ${activeChat?.type==='user'&&activeChat?.id===u._id?'bg-gray-100 font-medium':''}`}>
                  <div className="size-6 rounded-full bg-gray-200" />
                  <span>{u.name || u.email}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Chat Column */}
          <main className="flex flex-col h-full">
            <header className="px-5 py-4 border-b text-lg font-semibold">{activeChat?.type==='room' ? `#${rooms.find(r=>r._id===activeChat.id)?.name || 'general'}` : activeChat?.type==='user' ? (users.find(u=>u._id===activeChat.id)?.name || 'Conversation') : '#general'}</header>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.map((m) => (
                <div key={m._id} className={`max-w-[70%] p-3 rounded-lg ${m.sender===user?._id? 'bg-blue-50 ml-auto':'bg-gray-100'}`}>
                  {m.content}
                </div>
              ))}
              {Object.entries(typingUsers).some(([, v]) => v) && (
                <div className="text-xs text-gray-500 px-1">{connected ? 'Someone is typing…' : ''}</div>
              )}
              <div ref={endRef} />
            </div>
            <div className="px-5 py-4 border-t">
              <div className="flex items-center gap-2 bg-gray-50 border rounded-full px-3 py-2">
                <button type="button" className="text-xl">😊</button>
                <input
                  value={input}
                  onChange={(e) => { setInput(e.target.value); typing(true); }}
                  onBlur={() => typing(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                  className="flex-1 bg-transparent outline-none px-1"
                  placeholder={activeChat?.type==='room' ? `Message #${rooms.find(r=>r._id===activeChat.id)?.name || 'general'}` : 'Message'}
                />
                <button onClick={send} className="size-8 rounded-full bg-gray-800 text-white flex items-center justify-center">➤</button>
              </div>
            </div>
          </main>

          {/* Right Panel */}
          <aside className="border-l h-full flex flex-col">
            <div className="px-5 py-4 border-b font-semibold">Room Details</div>
            <div className="p-5">
              <div className="h-36 w-full bg-gray-100 rounded" />
            </div>
            <div className="px-5 py-4 border-b font-semibold">Files</div>
            <div className="p-5">
              <div className="h-24 w-full bg-gray-100 rounded" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


