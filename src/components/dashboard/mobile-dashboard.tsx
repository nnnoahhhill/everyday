"use client";

import { useState, useEffect, useRef } from "react";
import { useTasks, useLogTask, useDeleteTask, useCreateTask, useUpdateTask } from "@/hooks/use-tide";
import { useUIStore } from "@/store/use-ui-store";
import { UserButton } from "@clerk/nextjs";
import { Settings, X, Grid3x3, TrendingUp, ChevronUp, Edit2, Trash2, GripVertical } from "lucide-react";
import ProgressGrid from "./progress-grid";
import MoodTracker from "./mood-tracker";
import TodoListTab from "./todo-list-tab";
import SettingsModal from "./settings-modal";
import Onboarding from "./onboarding";
import { format } from "date-fns";

type TabType = "everyday" | "mood" | "todo";
type ViewMode = "list" | "grid" | "graph";

export default function MobileDashboard() {
  const { selectedDate } = useUIStore();
  const { data: tasks, isLoading } = useTasks(selectedDate);
  const logTask = useLogTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  
  const [activeTab, setActiveTab] = useState<TabType>("everyday");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showSettings, setShowSettings] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [showTaskSettings, setShowTaskSettings] = useState(false);
  const [selectedTaskForSettings, setSelectedTaskForSettings] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTaskId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("tide_onboarding_complete") === "true";
      setOnboardingComplete(completed);
    }
  }, []);

  if (!isLoading && (!tasks || tasks.length === 0 || !onboardingComplete)) {
    return <Onboarding onComplete={() => {
      setOnboardingComplete(true);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }} />;
  }

  const handleTaskTap = (taskId: string) => {
    if (showTaskSettings) {
      // If settings mode is on, show task settings instead
      setSelectedTaskForSettings(taskId);
      return;
    }
    
    const task = tasks?.find((t: any) => t.id === taskId);
    const log = task?.logs?.[0];
    const currentStatus = log?.status;
    
    if (currentStatus === "DONE") {
      // Clear (re-tap)
      fetch(`/api/task-log?taskId=${taskId}&localDate=${selectedDate}`, {
        method: "DELETE",
      }).then(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      });
    } else if (currentStatus === "PARTIAL") {
      // PARTIAL -> DONE
      logTask.mutate({ taskId, localDate: selectedDate, status: "DONE" });
    } else {
      // MISSED -> DONE (quick tap)
      logTask.mutate({ taskId, localDate: selectedDate, status: "DONE" });
    }
  };

  const handleTaskLongPress = (taskId: string) => {
    const task = tasks?.find((t: any) => t.id === taskId);
    const log = task?.logs?.[0];
    const currentStatus = log?.status;
    
    if (currentStatus === "PARTIAL") {
      // Clear partial
      fetch(`/api/task-log?taskId=${taskId}&localDate=${selectedDate}`, {
        method: "DELETE",
      }).then(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      });
    } else {
      // Set to PARTIAL
      logTask.mutate({ taskId, localDate: selectedDate, status: "PARTIAL" });
    }
  };

  const handleTouchStart = (taskId: string) => {
    longPressTaskId.current = taskId;
    longPressTimer.current = setTimeout(() => {
      if (longPressTaskId.current === taskId) {
        handleTaskLongPress(taskId);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (taskId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressTaskId.current === taskId) {
      handleTaskTap(taskId);
      longPressTaskId.current = null;
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

  const handleSaveEdit = async (taskId: string) => {
    if (editName.trim()) {
      await updateTask.mutateAsync({ taskId, name: editName.trim() });
      setEditingId(null);
      setEditName("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Main Content */}
      {activeTab === "everyday" && viewMode === "list" && (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-black">Every Day</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTaskSettings(!showTaskSettings)}
                  className={`p-2 border border-black ${
                    showTaskSettings ? "bg-black text-white" : "bg-white text-black"
                  } hover:bg-black hover:text-white`}
                  title="Task Settings"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-2 border border-black hover:bg-black hover:text-white"
                  title="View Grid"
                >
                  <Grid3x3 size={20} />
                </button>
              </div>
            </div>
            
            {showAddForm && (
              <form onSubmit={handleAddTask} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Add task"
                    className="flex-1 border border-black px-3 py-2 text-black bg-white focus:outline-none"
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
                    <X size={16} />
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {tasks?.map((task: any) => {
                const log = task.logs?.[0];
                const status = log?.status;
                const isDone = status === "DONE";
                const isPartial = status === "PARTIAL";
                
                return (
                  <div
                    key={task.id}
                    className="border border-black p-4 bg-white"
                  >
                    {editingId === task.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 border border-black px-3 py-2 text-black bg-white focus:outline-none"
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
                          className="border border-black px-3 py-2 text-black hover:bg-black hover:text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                          className="border border-black px-3 py-2 text-black hover:bg-black hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center gap-3 flex-1"
                          onTouchStart={() => !showTaskSettings && handleTouchStart(task.id)}
                          onTouchEnd={() => !showTaskSettings && handleTouchEnd(task.id)}
                          onMouseDown={() => !showTaskSettings && handleTouchStart(task.id)}
                          onMouseUp={() => !showTaskSettings && handleTouchEnd(task.id)}
                          onMouseLeave={() => {
                            if (longPressTimer.current) {
                              clearTimeout(longPressTimer.current);
                              longPressTimer.current = null;
                            }
                          }}
                          onClick={() => showTaskSettings && handleTaskTap(task.id)}
                        >
                          <div className={`w-6 h-6 border-2 border-black flex items-center justify-center flex-shrink-0 ${
                            isDone ? "bg-black" : isPartial ? "bg-green-100" : "bg-white"
                          }`}>
                            {isDone && <span className="text-white text-sm">✓</span>}
                            {isPartial && <span className="text-black text-xs">○</span>}
                          </div>
                          <span className={`flex-1 text-black ${isDone ? "line-through opacity-60" : ""}`}>
                            {task.name}
                          </span>
                        </div>
                        {showTaskSettings && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(task.id);
                                setEditName(task.name);
                              }}
                              className="p-2 border border-black hover:bg-black hover:text-white"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${task.name}"?`)) {
                                  await deleteTask.mutateAsync(task.id);
                                }
                              }}
                              className="p-2 border border-black hover:bg-black hover:text-white"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-2 border-dashed border-black p-4 text-black hover:bg-black hover:text-white"
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "everyday" && viewMode === "grid" && (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-black">Progress Grid</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("list")}
                  className="p-2 border border-black hover:bg-black hover:text-white"
                  title="Back to List"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className="p-2 border border-black hover:bg-black hover:text-white"
                  title="Line Graph"
                >
                  <TrendingUp size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <ProgressGrid initialViewMode="grid" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "everyday" && viewMode === "graph" && (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-black">Progress Graph</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-2 border border-black hover:bg-black hover:text-white"
                  title="Grid View"
                >
                  <Grid3x3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-2 border border-black hover:bg-black hover:text-white"
                  title="Back to List"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <ProgressGrid initialViewMode="graph" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "mood" && (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-black mb-4">How You Feeling Today</h1>
            <MoodTracker />
          </div>
        </div>
      )}

      {activeTab === "todo" && (
        <div className="flex-1 overflow-y-auto pb-20">
          <TodoListTab />
        </div>
      )}

      {/* Bottom Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-black bg-white z-30">
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab("everyday");
              setViewMode("list");
            }}
            className={`flex-1 py-3 text-center font-semibold ${
              activeTab === "everyday" ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            Every Day
          </button>
          <button
            onClick={() => setActiveTab("mood")}
            className={`flex-1 py-3 text-center font-semibold ${
              activeTab === "mood" ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            Feeling
          </button>
          <button
            onClick={() => setActiveTab("todo")}
            className={`flex-1 py-3 text-center font-semibold ${
              activeTab === "todo" ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            To Do
          </button>
        </div>
      </div>

      {/* Collapsible Bottom Panel for Settings/User */}
      <div className={`fixed bottom-16 left-0 right-0 bg-white border-t border-black transition-transform duration-300 z-20 ${
        showBottomPanel ? "translate-y-0" : "translate-y-full"
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black">Settings</h2>
            <button
              onClick={() => setShowBottomPanel(false)}
              className="p-2 border border-black hover:bg-black hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowSettings(true);
                setShowBottomPanel(false);
              }}
              className="w-full border border-black px-4 py-2 text-black hover:bg-black hover:text-white text-left"
            >
              Settings
            </button>
            <div className="flex items-center justify-between border border-black px-4 py-2">
              <span className="text-black">Account</span>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "border border-black",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expand Button */}
      <button
        onClick={() => setShowBottomPanel(!showBottomPanel)}
        className="fixed bottom-20 right-4 p-3 border border-black bg-white hover:bg-black hover:text-white rounded-full shadow-lg z-40"
      >
        {showBottomPanel ? <ChevronUp size={20} /> : <Settings size={20} />}
      </button>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
