"use client";

import { useState, useEffect } from "react";
import { useCreateTask, useTasks } from "@/hooks/use-tide";
import { useQueryClient } from "@tanstack/react-query";
import { X, ChevronRight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface OnboardingProps {
  onComplete?: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [taskName, setTaskName] = useState("");
  const createTask = useCreateTask();
  const { data: tasks, refetch } = useTasks();
  const queryClient = useQueryClient();

  // Sync local state with server tasks
  const currentTasks = tasks || [];

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || currentTasks.length >= 20) return;

    try {
      await createTask.mutateAsync(taskName.trim());
      setTaskName("");
      // Invalidate and refetch to update the list
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await refetch();
    } catch (error: any) {
      alert(error.message || "Failed to create task");
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        await refetch();
      }
    } catch (error) {
      alert("Failed to remove task");
    }
  };

  const handleContinue = () => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem("tide_onboarding_complete", "true");
    // Notify parent component
    if (onComplete) {
      onComplete();
    } else {
      // If no onComplete callback, reload to trigger dashboard view
      window.location.reload();
    }
  };

  const canContinue = currentTasks.length > 0;

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-black p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">TIDE</h1>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonPopoverCard: "border border-black",
              userButtonPopoverActionButton: "text-black hover:bg-black hover:text-white",
            },
          }}
        />
      </header>
      
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-8">
          <form onSubmit={handleAddTask} className="mb-6">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter things you want to do every day"
              className="w-full border border-black px-6 py-4 text-white bg-black placeholder:text-white placeholder:opacity-50 focus:outline-none focus:ring-0 text-xl"
              maxLength={50}
              autoFocus
              disabled={currentTasks.length >= 20 || createTask.isPending}
            />
            {currentTasks.length >= 20 && (
              <p className="mt-2 text-sm text-black">Maximum 20 tasks reached</p>
            )}
          </form>

          <div className="border border-black max-h-[50vh] overflow-y-auto">
            {currentTasks.length === 0 ? (
              <div className="p-8 text-center text-black">
                <p>Start adding things you want to do every day</p>
              </div>
            ) : (
              <div className="divide-y divide-black">
                {currentTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-4 flex items-center justify-between hover:bg-black hover:text-white group"
                  >
                    <span className="text-black group-hover:text-white">{task.name}</span>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-black group-hover:text-white hover:opacity-70"
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="border border-black px-8 py-3 text-black bg-white hover:bg-black hover:text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black flex items-center gap-2 mx-auto"
            >
              Continue
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
