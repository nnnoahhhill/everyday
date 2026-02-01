"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tide";
import { UserButton } from "@clerk/nextjs";
import TaskPanel from "./task-panel";
import ProgressGrid from "./progress-grid";
import SettingsModal from "./settings-modal";
import Onboarding from "./onboarding";
import { Settings } from "lucide-react";

export default function DashboardClient() {
  const [showSettings, setShowSettings] = useState(false);
  const { data: tasks, isLoading } = useTasks();
  const hasTasks = tasks && tasks.length > 0;

  // If no tasks, show onboarding (new users start here)
  if (!isLoading && !hasTasks) {
    return <Onboarding onComplete={() => {}} />;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-black p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">TIDE</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="text-black hover:bg-black hover:text-white p-2"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "border border-black",
                userButtonPopoverActionButton: "text-black hover:bg-black hover:text-white",
              },
            }}
          />
        </div>
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
