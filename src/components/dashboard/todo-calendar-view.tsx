"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TodoCalendarViewProps {
  todos: any[];
}

export default function TodoCalendarView({ todos }: TodoCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTodosForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return todos.filter((todo) => {
      if (todo.listType === "today" && format(new Date(), "yyyy-MM-dd") === dateStr) return true;
      if (todo.listType === "tomorrow" && format(new Date(Date.now() + 86400000), "yyyy-MM-dd") === dateStr) return true;
      if (todo.listType === "this_week" || todo.listType === "this_month") {
        const assignedDate = todo.assignedDate ? new Date(todo.assignedDate) : null;
        if (assignedDate && format(assignedDate, "yyyy-MM-dd") === dateStr) return true;
      }
      return false;
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 border border-black text-black hover:bg-black hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-xl font-bold text-black">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 border border-black text-black hover:bg-black hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 border border-black">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-bold text-black border-b border-black">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="p-1 min-h-[80px] border border-black bg-gray-50" />
        ))}

        {days.map((day) => {
          const dayTodos = getTodosForDate(day);
          return (
            <div
              key={day.toISOString()}
              className={`p-1 min-h-[80px] border border-black ${
                isToday(day) ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              <div className={`text-xs font-bold mb-1 ${isToday(day) ? "text-white" : "text-black"}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayTodos.slice(0, 3).map((todo) => (
                  <div
                    key={todo.id}
                    className={`text-xs truncate px-1 py-0.5 border ${
                      todo.status === "completed"
                        ? "bg-green-600 text-white border-white"
                        : isToday(day)
                        ? "bg-white text-black border-black"
                        : "bg-gray-100 text-black border-black"
                    }`}
                    title={todo.todoItem?.title}
                  >
                    {todo.todoItem?.title}
                  </div>
                ))}
                {dayTodos.length > 3 && (
                  <div className="text-xs text-black opacity-70">
                    +{dayTodos.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
