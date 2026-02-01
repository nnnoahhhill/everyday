import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useTasks(date?: string) {
  return useQuery({
    queryKey: ["tasks", date],
    queryFn: async () => {
      const url = date ? `/api/tasks?date=${date}` : "/api/tasks";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
}

export function useGrid(start: string, end: string) {
  return useQuery({
    queryKey: ["grid", start, end],
    queryFn: async () => {
      const res = await fetch(`/api/grid?start=${start}&end=${end}`);
      if (!res.ok) throw new Error("Failed to fetch grid");
      return res.json();
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["grid"] });
    },
  });
}

export function useLogTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, localDate, status }: { taskId: string; localDate: string; status: "DONE" | "PARTIAL" }) => {
      const res = await fetch("/api/task-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, localDate, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log task");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grid"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.localDate] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  const { selectedDate } = require("@/store/use-ui-store").useUIStore.getState();
  
  return useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus?: string }) => {
      // Toggle: DONE -> clear (MISSED), anything else -> DONE
      if (currentStatus === "DONE") {
        // Clear the log to make it MISSED
        const res = await fetch(`/api/task-log?taskId=${taskId}&localDate=${selectedDate}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to clear task");
        }
        return res.json();
      } else {
        // Set to DONE
        const res = await fetch("/api/task-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, localDate: selectedDate, status: "DONE" }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to log task");
        }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grid"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["grid"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, name, active }: { taskId: string; name?: string; active?: boolean }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, active }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["grid"] });
    },
  });
}

export function useClearTaskLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, localDate }: { taskId: string; localDate: string }) => {
      const res = await fetch(`/api/task-log?taskId=${taskId}&localDate=${localDate}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clear task log");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grid"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.localDate] });
    },
  });
}
