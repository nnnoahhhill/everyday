"use client";

import { useState } from "react";
import { useCreateTask } from "@/hooks/use-tide";
import { Plus } from "lucide-react";

export default function TaskInput() {
  const [name, setName] = useState("");
  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createTask.mutateAsync(name.trim());
      setName("");
    } catch (error: any) {
      alert(error.message || "Failed to create task");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto mb-8">
      <input
        type="text"
        placeholder="What do you do every day?"
        className="w-full px-6 py-4 text-lg rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        disabled={createTask.isPending}
      />
      <button
        type="submit"
        disabled={createTask.isPending}
        className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50"
      >
        <Plus size={24} />
      </button>
      <div className="absolute -bottom-6 left-6 text-xs text-gray-400">
        {name.length}/50 characters
      </div>
      {createTask.isError && (
        <div className="absolute -bottom-8 left-6 text-xs text-red-600 mt-2">
          {createTask.error?.message || "Failed to create task"}
        </div>
      )}
    </form>
  );
}
