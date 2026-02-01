"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

interface TodoFiltersProps {
  onFilterChange: (filters: {
    tags: string[];
    intensity: string | null;
    daysNeeded: number | null;
  }) => void;
  availableTags: string[];
}

export default function TodoFilters({ onFilterChange, availableTags }: TodoFiltersProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<string | null>(null);
  const [daysNeeded, setDaysNeeded] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    applyFilters(newTags, intensity, daysNeeded);
  };

  const handleIntensityChange = (value: string) => {
    const newIntensity = value === intensity ? null : value;
    setIntensity(newIntensity);
    applyFilters(selectedTags, newIntensity, daysNeeded);
  };

  const handleDaysNeededChange = (value: string) => {
    const num = value === "" ? null : parseInt(value);
    setDaysNeeded(num);
    applyFilters(selectedTags, intensity, num);
  };

  const applyFilters = (tags: string[], intensity: string | null, days: number | null) => {
    onFilterChange({ tags, intensity, daysNeeded: days });
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setIntensity(null);
    setDaysNeeded(null);
    applyFilters([], null, null);
  };

  return (
    <div className="border-b border-black p-2">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-black border border-black px-3 py-1 hover:bg-black hover:text-white"
      >
        <Filter size={14} />
        Filters
        {(selectedTags.length > 0 || intensity || daysNeeded) && (
          <span className="text-xs bg-black text-white px-1 rounded">
            {selectedTags.length + (intensity ? 1 : 0) + (daysNeeded ? 1 : 0)}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="mt-3 space-y-3 p-3 border border-black bg-white">
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`text-xs px-2 py-1 border border-black ${
                    selectedTags.includes(tag)
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">Intensity</label>
            <div className="flex gap-2">
              {["chill", "moderate", "kinda_hard", "damn_son"].map((int) => (
                <button
                  key={int}
                  onClick={() => handleIntensityChange(int)}
                  className={`text-xs px-2 py-1 border border-black capitalize ${
                    intensity === int
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {int.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">Days Needed</label>
            <input
              type="number"
              min="0"
              value={daysNeeded || ""}
              onChange={(e) => handleDaysNeededChange(e.target.value)}
              placeholder="Any"
              className="border border-black px-2 py-1 text-sm text-black bg-white w-24"
            />
          </div>

          <button
            onClick={clearFilters}
            className="text-xs text-black border border-black px-3 py-1 hover:bg-black hover:text-white"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
