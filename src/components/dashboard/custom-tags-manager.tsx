"use client";

import { useState, useEffect } from "react";
import { Plus, X, Tag } from "lucide-react";

export default function CustomTagsManager() {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/labels");
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Failed to fetch tags", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (res.ok) {
        setNewTagName("");
        fetchTags();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create tag");
      }
    } catch (error) {
      alert("Failed to create tag");
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag? It will be removed from all todo items.")) {
      return;
    }

    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchTags();
      } else {
        alert("Failed to delete tag");
      }
    } catch (error) {
      alert("Failed to delete tag");
    }
  };

  if (isLoading) {
    return <div className="text-sm text-black">Loading tags...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black">Custom Tags</h3>

      <form onSubmit={handleCreateTag} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 border border-black px-3 py-2 text-black bg-white focus:outline-none"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={!newTagName.trim()}
            className="border border-black px-4 py-2 text-black bg-white hover:bg-black hover:text-white disabled:opacity-50"
          >
            <Plus size={16} className="inline mr-1" />
            Add
          </button>
        </div>
      </form>

      {tags.length === 0 ? (
        <p className="text-sm text-black">No custom tags yet. Create one above!</p>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-black mb-2">Your Tags:</div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 border border-black px-3 py-1 bg-white text-black"
              >
                <Tag size={14} />
                <span className="text-sm">{tag.name}</span>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="text-black hover:text-red-600"
                  title="Delete tag"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
