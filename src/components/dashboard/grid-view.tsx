"use client";

import { useGrid } from "@/hooks/use-tide";
import { useUIStore } from "@/store/use-ui-store";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function GridView() {
  const end = new Date();
  const start = subDays(end, 28); // Show last 4 weeks
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const { data: gridData, isLoading } = useGrid(startStr, endStr);
  const days = eachDayOfInterval({ start, end });

  if (isLoading) return <div className="text-center py-10">Loading grid...</div>;
  if (!gridData || gridData.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No tasks to display. Create tasks to see your progress grid!</p>
      </div>
    );
  }

  return (
    <div className="mt-12 overflow-x-auto pb-6">
      <div className="inline-block min-w-full align-middle">
        <div className="space-y-6">
          {gridData?.map((task: any) => (
            <div key={task.id} className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-500 ml-1">{task.name}</h4>
              <div className="flex gap-1">
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  // Properly parse and compare dates instead of using startsWith
                  const dayDate = format(day, "yyyy-MM-dd");
                  const log = task.logs?.find((l: any) => {
                    if (!l.localDate) return false;
                    // Handle both Date objects and ISO strings
                    const logDate = typeof l.localDate === 'string' 
                      ? l.localDate.split('T')[0] 
                      : format(new Date(l.localDate), "yyyy-MM-dd");
                    return logDate === dayDate;
                  });
                  const status = log?.status;

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "w-4 h-4 rounded-sm transition-colors cursor-help",
                        !status && "bg-gray-100",
                        status === "PARTIAL" && "bg-orange-300",
                        status === "DONE" && "bg-green-500"
                      )}
                      title={`${dateStr}: ${status || "Missed"}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
