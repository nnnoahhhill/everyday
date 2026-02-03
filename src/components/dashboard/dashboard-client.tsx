"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/use-tide";
import { UserButton } from "@clerk/nextjs";
import TaskPanel from "./task-panel";
import ProgressGrid from "./progress-grid";
import SettingsModal from "./settings-modal";
import Onboarding from "./onboarding";
import TodoListTab from "./todo-list-tab";
import MoodTracker from "./mood-tracker";
import MobileDashboard from "./mobile-dashboard";
import { Settings } from "lucide-react";

type TabType = "everyday" | "todo";

export default function DashboardClient() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return <MobileDashboard />;
  }
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("everyday");
  const { data: tasks, isLoading } = useTasks();
  const hasTasks = tasks && tasks.length > 0;
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check if onboarding is complete from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("tide_onboarding_complete") === "true";
      setOnboardingComplete(completed);
    }
  }, []);

  // If no tasks OR onboarding not complete, show onboarding
  if (!isLoading && (!hasTasks || !onboardingComplete)) {
    return <Onboarding onComplete={() => {
      setOnboardingComplete(true);
      // Force a re-render by invalidating queries
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }} />;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="border-b border-black p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1 border border-black">
            <button
              onClick={() => setActiveTab("everyday")}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === "everyday" 
                  ? "bg-black text-white" 
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              Every Day
            </button>
            <button
              onClick={() => setActiveTab("todo")}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === "todo" 
                  ? "bg-black text-white" 
                  : "bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              To Do
            </button>
          </div>
        </div>
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
      
      {activeTab === "everyday" ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 h-full">
            <TaskPanel />
          </div>
          <div className="w-2/3 border-l border-black h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ProgressGrid />
            </div>
            <div className="border-t border-black">
              <MoodTracker />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <TodoListTab />
        </div>
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
