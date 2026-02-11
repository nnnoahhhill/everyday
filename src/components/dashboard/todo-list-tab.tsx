"use client";

import { useState } from "react";
import TodoMasterBank from "./todo-master-bank";
import TodoListView from "./todo-list-view";
import TodoCalendarView from "./todo-calendar-view";

type ListType = "today" | "tomorrow" | "this_week" | "this_month" | "bank" | "calendar";

export default function TodoListTab() {
  const [activeList, setActiveList] = useState<ListType>("today");

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="border-b border-black p-4">
        <div className="flex gap-1 border border-black">
          <button
            onClick={() => setActiveList("bank")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeList === "bank"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            Master Bank
          </button>
          <button
            onClick={() => setActiveList("today")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeList === "today"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveList("tomorrow")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeList === "tomorrow"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            Tomorrow
          </button>
          <button
            onClick={() => setActiveList("this_week")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeList === "this_week"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setActiveList("this_month")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeList === "this_month"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setActiveList("calendar")}
            className={`px-4 py-2 text-sm font-semibold ${
              activeList === "calendar"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Content */}
      {activeList === "bank" ? (
        <TodoMasterBank />
      ) : activeList === "calendar" ? (
        <TodoCalendarView todos={[]} />
      ) : (
        <TodoListView listType={activeList} />
      )}
    </div>
  );
}
