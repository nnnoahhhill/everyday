"use client";

import { useState, useEffect } from "react";
import { GripVertical, Check, ArrowRight, X, Plus } from "lucide-react";
import { format } from "date-fns";
import TodoFilters from "./todo-filters";

type ListType = "today" | "tomorrow" | "this_week" | "this_month";

interface TodoListViewProps {
  listType: ListType;
}

export default function TodoListView({ listType }: TodoListViewProps) {
  const [todos, setTodos] = useState<any[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{ tags: string[]; intensity: string | null; daysNeeded: number | null }>({
    tags: [],
    intensity: null,
    daysNeeded: null,
  });

  useEffect(() => {
    fetchTodos();
  }, [listType]);

  useEffect(() => {
    applyFilters();
  }, [todos, filters]);

  const applyFilters = () => {
    let filtered = [...todos];

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter((todo) => {
        const item = todo.todoItem;
        if (!item) return false;
        const allTags = [
          ...(item.isFun ? ["fun"] : []),
          ...(item.isWork ? ["work"] : []),
          ...(item.isPlay ? ["play"] : []),
          ...(item.customLabels || []),
        ];
        return filters.tags.some((tag) => allTags.includes(tag));
      });
    }

    // Filter by intensity
    if (filters.intensity) {
      filtered = filtered.filter((todo) => todo.todoItem?.intensity === filters.intensity);
    }

    // Filter by days needed
    if (filters.daysNeeded !== null) {
      filtered = filtered.filter((todo) => todo.todoItem?.daysNeeded === filters.daysNeeded);
    }

    setFilteredTodos(filtered);
  };

  const getAvailableTags = () => {
    const tagSet = new Set<string>();
    todos.forEach((todo) => {
      const item = todo.todoItem;
      if (!item) return;
      if (item.isFun) tagSet.add("fun");
      if (item.isWork) tagSet.add("work");
      if (item.isPlay) tagSet.add("play");
      (item.customLabels || []).forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/todos?listType=${listType}`);
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (error) {
      console.error("Failed to fetch todos", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (todoId: string) => {
    try {
      const res = await fetch(`/api/todos/${todoId}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error("Failed to complete todo", error);
    }
  };

  const handlePush = async (todoId: string, toListType: ListType) => {
    try {
      const res = await fetch(`/api/todos/${todoId}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toListType }),
      });
      if (res.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error("Failed to push todo", error);
    }
  };

  const handleRemove = async (todoId: string) => {
    if (!confirm("Remove from list? (Item stays in master bank)")) return;
    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error("Failed to remove todo", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  const handleAddFromBank = async (todoItemId: string) => {
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todoItemId,
          listType,
        }),
      });
      if (res.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error("Failed to add todo", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-black">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-black capitalize">
            {listType.replace('_', ' ')}
          </h2>
          <AddFromBankButton onAdd={handleAddFromBank} />
        </div>
        <TodoFilters onFilterChange={setFilters} availableTags={getAvailableTags()} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTodos.length === 0 && todos.length > 0 ? (
          <div className="text-center text-black py-8">
            <p>No todos match the current filters.</p>
            <p className="text-sm mt-2">Try adjusting your filters.</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center text-black py-8">
            <p>No todos for {listType.replace('_', ' ')}.</p>
            <p className="text-sm mt-2">Add items from the master bank.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="border border-black p-3 hover:bg-black hover:text-white group bg-white"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="text-black group-hover:text-white mt-1 cursor-move" size={16} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-black group-hover:text-white">{todo.todoItem?.title}</h3>
                    {todo.status === "completed" && (
                      <span className="text-xs px-2 py-0.5 border border-current bg-green-600 text-white">
                        Done
                      </span>
                    )}
                  </div>
                  {todo.todoItem?.description && (
                    <p className="text-sm mt-1 opacity-80 text-black group-hover:text-white">{todo.todoItem.description}</p>
                  )}
                  <div className="flex gap-2 mt-2 flex-wrap items-center">
                    {todo.doneByDate && (
                      <span className="text-xs text-black group-hover:text-white">
                        Due: {format(new Date(todo.doneByDate), "MMM d")}
                      </span>
                    )}
                    {todo.scheduledTime && (
                      <span className="text-xs text-black group-hover:text-white">
                        @ {format(new Date(todo.scheduledTime), "h:mm a")}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 border border-black group-hover:border-white text-black group-hover:text-white capitalize">
                      {todo.todoItem?.intensity?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {todo.status !== "completed" && (
                    <button
                      onClick={() => handleComplete(todo.id)}
                      className="p-1 text-black group-hover:text-white border border-black group-hover:border-white hover:bg-black hover:text-white"
                      title="Complete"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {listType !== "tomorrow" && (
                    <button
                      onClick={() => handlePush(todo.id, "tomorrow")}
                      className="p-1 text-black group-hover:text-white border border-black group-hover:border-white hover:bg-black hover:text-white"
                      title="Push to Tomorrow"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(todo.id)}
                    className="p-1 text-black group-hover:text-white border border-black group-hover:border-white hover:bg-black hover:text-white"
                    title="Remove from List"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function AddFromBankButton({ onAdd }: { onAdd: (todoItemId: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/todo-items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch items", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchItems();
    }
  }, [showModal]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="border border-black px-3 py-1 text-sm text-black hover:bg-black hover:text-white"
      >
        <Plus size={16} className="inline mr-1" />
        Add from Bank
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-black p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">Add from Master Bank</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-black hover:bg-black hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            {isLoading ? (
              <p className="text-black">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-black">No items in bank yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onAdd(item.id);
                      setShowModal(false);
                    }}
                    className="w-full text-left border border-black p-3 hover:bg-black hover:text-white"
                  >
                    <div className="font-semibold">{item.title}</div>
                    {item.description && (
                      <div className="text-sm mt-1 opacity-80">{item.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
