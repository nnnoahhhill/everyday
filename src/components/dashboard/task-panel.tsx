"use client";

import { useState } from "react";
import { useTasks, useLogTask, useDeleteTask, useCreateTask, useUpdateTask } from "@/hooks/use-tide";
import { useUIStore } from "@/store/use-ui-store";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function TaskPanel() {
  const { selectedDate } = useUIStore();
  const { data: tasks, isLoading } = useTasks(selectedDate);
  const logTask = useLogTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  const handleTaskClick = (taskId: string, status?: "DONE" | "PARTIAL") => {
    const task = tasks?.find((t: any) => t.id === taskId);
    const log = task?.logs?.[0];
    const currentStatus = log?.status;
    
    if (status) {
      // Explicit status set (from right-click or button)
      if (status === currentStatus) {
        // If clicking same status, clear it
        fetch(`/api/task-log?taskId=${taskId}&localDate=${selectedDate}`, {
          method: "DELETE",
        }).then(() => {
          window.location.reload();
        });
      } else {
        logTask.mutate({ taskId, localDate: selectedDate, status });
      }
    } else {
      // Default click: cycle through MISSED -> PARTIAL -> DONE -> MISSED
      if (currentStatus === "DONE") {
        // DONE -> clear (MISSED)
        fetch(`/api/task-log?taskId=${taskId}&localDate=${selectedDate}`, {
          method: "DELETE",
        }).then(() => {
          window.location.reload();
        });
      } else if (currentStatus === "PARTIAL") {
        // PARTIAL -> DONE
        logTask.mutate({ taskId, localDate: selectedDate, status: "DONE" });
      } else {
        // MISSED -> PARTIAL
        logTask.mutate({ taskId, localDate: selectedDate, status: "PARTIAL" });
      }
    }
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setEditName(task.name);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (editName.trim()) {
      await updateTask.mutateAsync({ taskId, name: editName.trim() });
      setEditingId(null);
      setEditName("");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      await createTask.mutateAsync(newTaskName.trim());
      setNewTaskName("");
      setShowAddForm(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-black">Loading...</div>;
  }

  const hasTasks = tasks && tasks.length > 0;

  return (
    <div className="h-full flex flex-col border-r border-black bg-white">
      <div className="p-6 border-b border-black">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Tasks</h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-black border border-black px-3 py-1 text-sm hover:bg-black hover:text-white"
            >
              <Plus size={16} className="inline mr-1" />
              Add
            </button>
          )}
        </div>
        
        {showAddForm && (
          <form onSubmit={handleAddTask} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Enter things you want to do every day"
                className="flex-1 border border-black px-3 py-2 text-white bg-black placeholder:text-white placeholder:opacity-50 focus:outline-none focus:ring-0"
                maxLength={50}
                autoFocus
              />
              <button
                type="submit"
                disabled={!newTaskName.trim() || createTask.isPending}
                className="border border-black px-4 py-2 text-black hover:bg-black hover:text-white disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTaskName("");
                }}
                className="border border-black px-4 py-2 text-black hover:bg-black hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {hasTasks && (
          <div className="divide-y divide-black">
            {tasks.map((task: any) => {
              const log = task.logs?.[0];
              const status = log?.status;
              const isDone = status === "DONE";
              const isPartial = status === "PARTIAL";
              
              return (
                <div
                  key={task.id}
                  className="p-2 hover:bg-black hover:text-white group"
                >
                  {editingId === task.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-black px-2 py-1 text-white bg-black placeholder:text-white placeholder:opacity-50 focus:outline-none"
                        maxLength={50}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(task.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditName("");
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="border border-black px-2 py-1 text-black hover:bg-black hover:text-white text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName("");
                        }}
                        className="border border-black px-2 py-1 text-black hover:bg-black hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => handleTaskClick(task.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          <span className={`w-3 h-3 border border-black group-hover:border-white flex items-center justify-center flex-shrink-0 ${
                            isDone ? "bg-black group-hover:bg-white" : isPartial ? "bg-black bg-opacity-50 group-hover:bg-white group-hover:bg-opacity-50" : ""
                          }`}>
                            {isDone && <span className="text-white group-hover:text-black text-xs">✓</span>}
                            {isPartial && <span className="text-white group-hover:text-black text-xs">○</span>}
                          </span>
                          <span className={`text-black group-hover:text-white text-sm ${isDone ? "line-through" : ""}`}>{task.name}</span>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task.id, "PARTIAL");
                            }}
                            className="px-1.5 py-0.5 text-xs border border-black text-black group-hover:text-white group-hover:border-white hover:bg-black hover:text-white"
                            title="Mark partial"
                          >
                            P
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task.id, "DONE");
                            }}
                            className="px-1.5 py-0.5 text-xs border border-black text-black group-hover:text-white group-hover:border-white hover:bg-black hover:text-white"
                            title="Mark done"
                          >
                            D
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(task);
                          }}
                          className="p-1 text-black border border-black group-hover:text-white group-hover:border-white hover:bg-black hover:text-white"
                          title="Edit name"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${task.name}"?`)) {
                              await deleteTask.mutateAsync(task.id);
                            }
                          }}
                          className="p-1 text-black border border-black group-hover:text-white group-hover:border-white hover:bg-black hover:text-white"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
