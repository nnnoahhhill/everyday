"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/use-tide";
import TaskPanel from "./task-panel";
import ProgressGrid from "./progress-grid";
import SettingsModal from "./settings-modal";
import Onboarding from "./onboarding";
import { Settings } from "lucide-react";

export default function DashboardClient() {
  const [showSettings, setShowSettings] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const { data: tasks, isLoading } = useTasks();
  const hasTasks = tasks && tasks.length > 0;

  // Check localStorage for onboarding completion status
  useEffect(() => {
    const completed = localStorage.getItem("tide_onboarding_complete") === "true";
    setOnboardingComplete(completed);
  }, []);

  // If no tasks, always show onboarding (reset onboarding state)
  useEffect(() => {
    if (!hasTasks && !isLoading) {
      localStorage.removeItem("tide_onboarding_complete");
      setOnboardingComplete(false);
    }
  }, [hasTasks, isLoading]);

  // If no tasks OR onboarding not complete, show onboarding
  if (!isLoading && (!hasTasks || !onboardingComplete)) {
    return <Onboarding onComplete={() => setOnboardingComplete(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-black p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">TIDE</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="text-black hover:bg-black hover:text-white p-2"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3">
          <TaskPanel />
        </div>
        <div className="w-2/3 border-l border-black">
          <ProgressGrid />
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
