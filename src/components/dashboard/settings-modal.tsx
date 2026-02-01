"use client";

import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ColorSettings from "./color-settings";
import CustomTagsManager from "./custom-tags-manager";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: archivedTasks } = useQuery({
    queryKey: ["tasks", "archived"],
    queryFn: async () => {
      const res = await fetch("/api/tasks?archived=true");
      if (!res.ok) throw new Error("Failed to fetch archived tasks");
      return res.json();
    },
    enabled: showArchived && isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-black" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="text-xl font-bold text-black">Settings</h2>
          <button
            onClick={onClose}
            className="text-black hover:bg-black hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          <ColorSettings />
          
          <div className="border-t border-black pt-4">
            <CustomTagsManager />
          </div>
          
          <div className="border-t border-black pt-4">
            <h3 className="text-sm font-bold text-black mb-2">Archived Tasks</h3>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-sm text-black border border-black px-3 py-1 hover:bg-black hover:text-white"
            >
              {showArchived ? "Hide" : "Show"} Archived
            </button>
            {showArchived && (
              <div className="mt-2 space-y-1">
                {archivedTasks?.filter((t: any) => t.deletedAt).map((task: any) => (
                  <div key={task.id} className="text-sm text-black border border-black p-2">
                    {task.name} (archived {new Date(task.deletedAt).toLocaleDateString()})
                  </div>
                ))}
                {archivedTasks?.filter((t: any) => t.deletedAt).length === 0 && (
                  <p className="text-sm text-black">No archived tasks</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
