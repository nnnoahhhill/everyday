"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GripVertical, StickyNote } from "lucide-react";
import TodoNotesModal from "./todo-notes-modal";
import TodoFilters from "./todo-filters";

export default function TodoMasterBank() {
  const [items, setItems] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ tags: string[]; intensity: string | null; daysNeeded: number | null }>({
    tags: [],
    intensity: null,
    daysNeeded: null,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, filters]);

  const applyFilters = () => {
    let filtered = [...items];

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter((item) => {
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
      filtered = filtered.filter((item) => item.intensity === filters.intensity);
    }

    // Filter by days needed
    if (filters.daysNeeded !== null) {
      filtered = filtered.filter((item) => item.daysNeeded === filters.daysNeeded);
    }

    setFilteredItems(filtered);
  };

  const getAvailableTags = () => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      if (item.isFun) tagSet.add("fun");
      if (item.isWork) tagSet.add("work");
      if (item.isPlay) tagSet.add("play");
      (item.customLabels || []).forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

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

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-black">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Master Bank</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="border border-black px-3 py-1 text-sm text-black hover:bg-black hover:text-white"
          >
            <Plus size={16} className="inline mr-1" />
            Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-black py-8">
            <p>Loading...</p>
          </div>
        ) : filteredItems.length === 0 && items.length > 0 ? (
          <div className="text-center text-black py-8">
            <p>No items match the current filters.</p>
            <p className="text-sm mt-2">Try adjusting your filters.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-black py-8">
            <p>No items in master bank yet.</p>
            <p className="text-sm mt-2">Add items to build your todo bank.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
            <div
              key={item.id}
              className="border border-black p-3 hover:bg-black hover:text-white group bg-white"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="text-black group-hover:text-white mt-1" size={16} />
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-white">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm mt-1 opacity-80 text-black group-hover:text-white">{item.description}</p>
                  )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.isFun && (
                        <span className="text-xs px-2 py-0.5 border border-current">Fun</span>
                      )}
                      {item.isWork && (
                        <span className="text-xs px-2 py-0.5 border border-current">Work</span>
                      )}
                      {item.isPlay && (
                        <span className="text-xs px-2 py-0.5 border border-current">Play</span>
                      )}
                      <span className="text-xs px-2 py-0.5 border border-current capitalize">
                        {item.intensity?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedItemForNotes(item.id);
                        setNotesModalOpen(true);
                      }}
                      className="p-1 text-black group-hover:text-white border border-black group-hover:border-white hover:bg-black hover:text-white"
                      title="Notes"
                    >
                      <StickyNote size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="p-1 text-black group-hover:text-white border border-black group-hover:border-white hover:bg-black hover:text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete "${item.title}"?`)) {
                          try {
                            const res = await fetch(`/api/todo-items/${item.id}`, {
                              method: "DELETE",
                            });
                            if (res.ok) {
                              fetchItems();
                            }
                          } catch (error) {
                            alert("Failed to delete item");
                          }
                        }
                      }}
                      className="p-1 text-black group-hover:text-white border border-black group-hover:border-white hover:bg-black hover:text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="border-t border-black p-4 bg-white">
          <TodoItemForm
            onSave={async () => {
              setShowAddForm(false);
              await fetchItems();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {editingId && (
        <div className="border-t border-black p-4 bg-white">
          <TodoItemForm
            initialData={items.find((i) => i.id === editingId)}
            onSave={async () => {
              setEditingId(null);
              await fetchItems();
            }}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {notesModalOpen && selectedItemForNotes && (
        <TodoNotesModal
          isOpen={notesModalOpen}
          onClose={() => {
            setNotesModalOpen(false);
            setSelectedItemForNotes(null);
          }}
          todoItemId={selectedItemForNotes}
        />
      )}
    </div>
  );
}

function TodoItemForm({ onSave, onCancel, initialData }: any) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [intensity, setIntensity] = useState(initialData?.intensity || "moderate");
  const [daysNeeded, setDaysNeeded] = useState(initialData?.daysNeeded || "");
  const [isFun, setIsFun] = useState(initialData?.isFun || false);
  const [isWork, setIsWork] = useState(initialData?.isWork || false);
  const [isPlay, setIsPlay] = useState(initialData?.isPlay || false);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [customLabels, setCustomLabels] = useState<string[]>(initialData?.customLabels || []);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  const fetchAvailableTags = async () => {
    setIsLoadingTags(true);
    try {
      const res = await fetch("/api/labels");
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error("Failed to fetch tags", error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleTagToggle = (tagName: string) => {
    setCustomLabels((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title,
        description: description || undefined,
        notes: notes || undefined,
        intensity,
        daysNeeded: daysNeeded ? parseInt(daysNeeded) : undefined,
        isFun,
        isWork,
        isPlay,
      };

      if (initialData) {
        // Update
        const res = await fetch(`/api/todo-items/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        // Create
        const res = await fetch("/api/todo-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
      }
      onSave();
    } catch (error: any) {
      alert(error.message || "Failed to save");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border border-black px-3 py-2 text-black bg-white focus:outline-none"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full border border-black px-3 py-2 text-black bg-white focus:outline-none min-h-[60px]"
      />
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-semibold text-black mb-1 block">Intensity</label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full border border-black px-3 py-2 text-black bg-white"
          >
            <option value="chill">Chill</option>
            <option value="moderate">Moderate</option>
            <option value="kinda_hard">Kinda Hard</option>
            <option value="damn_son">Damn Son</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-semibold text-black mb-1 block">Days Needed</label>
          <input
            type="number"
            value={daysNeeded}
            onChange={(e) => setDaysNeeded(e.target.value)}
            placeholder="Optional"
            className="w-full border border-black px-3 py-2 text-black bg-white"
            min="1"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isFun}
            onChange={(e) => setIsFun(e.target.checked)}
            className="border border-black"
          />
          <span className="text-sm text-black">Fun</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isWork}
            onChange={(e) => setIsWork(e.target.checked)}
            className="border border-black"
          />
          <span className="text-sm text-black">Work</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPlay}
            onChange={(e) => setIsPlay(e.target.checked)}
            className="border border-black"
          />
          <span className="text-sm text-black">Play</span>
        </label>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full border border-black px-3 py-2 text-black bg-white focus:outline-none min-h-[60px]"
      />
      
      <div>
        <label className="text-sm font-semibold text-black mb-2 block">Custom Tags</label>
        {isLoadingTags ? (
          <p className="text-xs text-black">Loading tags...</p>
        ) : availableTags.length === 0 ? (
          <p className="text-xs text-black">No custom tags available. Create them in Settings.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={`text-xs px-2 py-1 border border-black ${
                  customLabels.includes(tag.name)
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
        {customLabels.length > 0 && (
          <div className="mt-2 text-xs text-black">
            Selected: {customLabels.join(", ")}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 border border-black px-4 py-2 text-black bg-white hover:bg-black hover:text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-black px-4 py-2 text-black bg-white hover:bg-black hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
