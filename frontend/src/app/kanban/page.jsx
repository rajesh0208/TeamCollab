"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const columns = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const priorityColors = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-red-100 text-red-800" };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing" onClick={() => onClick?.(task)}>
      <div className="flex items-center justify-between">
        <div className="font-medium truncate">{task.title}</div>
        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
      </div>
      {task.dueDate && <div className="text-xs text-gray-500 mt-1">Due {new Date(task.dueDate).toLocaleDateString()}</div>}
    </div>
  );
}

export default function KanbanPage() {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  // Load tasks
  useEffect(() => {
    fetch(`${API_BASE}/tasks`, { headers }).then((r) => r.json()).then(setTasks).catch(() => {});
    fetch(`${API_BASE}/chat/users`, { headers }).then((r) => r.json()).then(setUsers).catch(() => {});
  }, [headers]);

  // Realtime
  useEffect(() => {
    if (!socket) return;
    const onCreated = (t) => setTasks((prev) => (prev.find((x) => x._id === t._id) ? prev : [...prev, t]));
    const onUpdated = (t) => setTasks((prev) => prev.map((x) => (x._id === t._id ? t : x)));
    const onDeleted = ({ id }) => setTasks((prev) => prev.filter((x) => x._id !== id));
    socket.on("taskCreated", onCreated);
    socket.on("taskUpdated", onUpdated);
    socket.on("taskDeleted", onDeleted);
    return () => {
      socket.off("taskCreated", onCreated);
      socket.off("taskUpdated", onUpdated);
      socket.off("taskDeleted", onDeleted);
    };
  }, [socket]);

  const tasksByColumn = useMemo(() => ({
    "todo": tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    "done": tasks.filter((t) => t.status === "done"),
  }), [tasks]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id;

    // Determine start and destination columns
    const fromCol = columns.find((c) => tasksByColumn[c.id].some((t) => t._id === taskId))?.id;
    let toCol = over.id;

    // If dropping on a task card, its container is the target column
    if (columns.every((c) => c.id !== over.id)) {
      toCol = columns.find((c) => tasksByColumn[c.id].some((t) => t._id === over.id))?.id || fromCol;
    }
    if (!fromCol || !toCol) return;
    if (fromCol === toCol) return; // position within column not persisted now

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: toCol } : t)));
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: "PUT", headers, body: JSON.stringify({ status: toCol }) });
    } catch {}
  };

  const createTask = async () => {
    const title = prompt("Task title");
    if (!title) return;
    await fetch(`${API_BASE}/tasks`, { method: "POST", headers, body: JSON.stringify({ title, createdBy: user?.id }) });
  };

  const canDelete = (task) => {
    if (!task || !user) return false;
    const createdById = typeof task.createdBy === 'object' ? task.createdBy._id : task.createdBy;
    return user.role === 'admin' || String(createdById) === String(user.id);
  };

  const updateTask = async (taskId, payload) => {
    await fetch(`${API_BASE}/tasks/${taskId}`, { method: "PUT", headers, body: JSON.stringify(payload) });
  };

  const deleteTask = async (taskId) => {
    await fetch(`${API_BASE}/tasks/${taskId}`, { method: "DELETE", headers });
    setSelectedTask(null);
  };

  return (
    <div className="h-[100vh] w-full bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Kanban Board</h1>
          <button onClick={createTask} className="px-4 py-2 bg-blue-600 text-white rounded">New Task</button>
        </div>
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-4">
            {columns.map((col) => (
              <div key={col.id} className="bg-gray-100 rounded-xl p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">{col.title}</div>
                </div>
                <SortableContext items={tasksByColumn[col.id].map((t) => t._id)} strategy={verticalListSortingStrategy}>
                  <div id={col.id} className="space-y-3 min-h-10">
                    {tasksByColumn[col.id].map((t) => (
                      <TaskCard key={t._id} task={t} onClick={setSelectedTask} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white w-full max-w-xl rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-semibold">Task Details</div>
              <button className="text-gray-500" onClick={() => setSelectedTask(null)}>✕</button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-sm text-gray-600">Title</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  onBlur={() => updateTask(selectedTask._id, { title: selectedTask.title })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4} value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  onBlur={() => updateTask(selectedTask._id, { description: selectedTask.description })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Priority</label>
                  <select className="mt-1 w-full border rounded px-3 py-2" value={selectedTask.priority}
                    onChange={(e) => { setSelectedTask({ ...selectedTask, priority: e.target.value }); updateTask(selectedTask._id, { priority: e.target.value }); }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <select className="mt-1 w-full border rounded px-3 py-2" value={selectedTask.status}
                    onChange={(e) => { setSelectedTask({ ...selectedTask, status: e.target.value }); updateTask(selectedTask._id, { status: e.target.value }); }}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Due Date</label>
                  <input type="date" className="mt-1 w-full border rounded px-3 py-2"
                    value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().slice(0,10) : ''}
                    onChange={(e) => { setSelectedTask({ ...selectedTask, dueDate: e.target.value }); updateTask(selectedTask._id, { dueDate: e.target.value }); }}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Assignee</label>
                <select className="mt-1 w-full border rounded px-3 py-2"
                  value={typeof selectedTask.assignee === 'object' ? (selectedTask.assignee?._id || '') : (selectedTask.assignee || '')}
                  onChange={(e) => { setSelectedTask({ ...selectedTask, assignee: e.target.value }); updateTask(selectedTask._id, { assignee: e.target.value || null }); }}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-between">
              <div className="text-xs text-gray-500">Created by: {typeof selectedTask.createdBy === 'object' ? (selectedTask.createdBy?.email || selectedTask.createdBy?._id) : selectedTask.createdBy}</div>
              {canDelete(selectedTask) && (
                <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={() => deleteTask(selectedTask._id)}>Delete Task</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



