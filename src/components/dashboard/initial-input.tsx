"use client";

import { useState } from "react";
import { useCreateTask } from "@/hooks/use-tide";

export default function InitialInput() {
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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl px-8">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter things you want to do every day"
        className="w-full border border-black px-6 py-4 text-white bg-black placeholder:text-white placeholder:opacity-50 focus:outline-none focus:ring-0 text-xl"
        maxLength={50}
        autoFocus
        disabled={createTask.isPending}
      />
      {createTask.isError && (
        <p className="mt-2 text-sm text-black">{createTask.error?.message}</p>
      )}
    </form>
  );
}
