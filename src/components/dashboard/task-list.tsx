"use client";

import { useTasks, useLogTask, useDeleteTask, useClearTaskLog } from "@/hooks/use-tide";
import { useUIStore } from "@/store/use-ui-store";
import { Check, CircleDot, Trash2, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState } from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TaskList() {
  const { selectedDate } = useUIStore();
  const { data: tasks, isLoading, error } = useTasks(selectedDate);
  const logTask = useLogTask();
  const deleteTask = useDeleteTask();
  const clearLog = useClearTaskLog();
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  if (isLoading) return <div className="text-center py-10">Loading tasks...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Error loading tasks</div>;
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No tasks yet. Create your first task above!</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-3">
      {tasks.map((task: any) => {
        const log = task.logs?.[0];
        const status = log?.status; // DONE, PARTIAL, or undefined (MISSED)
        
        return (
          <div
            key={task.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border shadow-sm transition-colors",
              status === "DONE" && "bg-green-50 border-green-200",
              status === "PARTIAL" && "bg-orange-50 border-orange-200",
              !status && "bg-white border-gray-100"
            )}
            onMouseEnter={() => setHoveredTask(task.id)}
            onMouseLeave={() => setHoveredTask(null)}
          >
            <span className={cn(
              "font-medium",
              status === "DONE" && "text-green-900",
              status === "PARTIAL" && "text-orange-900",
              !status && "text-gray-700"
            )}>
              {task.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <button
                  onClick={() => logTask.mutate({ taskId: task.id, localDate: selectedDate, status: "PARTIAL" })}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    status === "PARTIAL" 
                      ? "bg-orange-200 text-orange-700" 
                      : "hover:bg-orange-50 text-gray-400 hover:text-orange-500"
                  )}
                  title="Mark as Partial"
                  disabled={logTask.isPending}
                >
                  <CircleDot size={20} />
                </button>
                <button
                  onClick={() => logTask.mutate({ taskId: task.id, localDate: selectedDate, status: "DONE" })}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    status === "DONE"
                      ? "bg-green-200 text-green-700"
                      : "hover:bg-green-50 text-gray-400 hover:text-green-500"
                  )}
                  title="Mark as Done"
                  disabled={logTask.isPending}
                >
                  <Check size={20} />
                </button>
                {status && (
                  <button
                    onClick={() => clearLog.mutate({ taskId: task.id, localDate: selectedDate })}
                    className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="Clear status (mark as missed)"
                    disabled={clearLog.isPending}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {hoveredTask === task.id && (
                <button
                  onClick={() => {
                    if (confirm(`Delete task "${task.name}"?`)) {
                      deleteTask.mutate(task.id);
                    }
                  }}
                  className="p-2 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500"
                  title="Delete task"
                  disabled={deleteTask.isPending}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
