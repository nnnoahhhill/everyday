"use client";

import { useState } from "react";
import { format } from "date-fns";

const FEELINGS = [
  "happy",
  "sad",
  "angry",
  "tired",
  "energized",
  "accomplished",
  "stressed",
  "anxious",
] as const;

export default function MoodTracker() {
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFeeling = (feeling: string) => {
    setSelectedFeelings((prev) =>
      prev.includes(feeling)
        ? prev.filter((f) => f !== feeling)
        : [...prev, feeling]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFeelings.length === 0) {
      alert("Please select at least one feeling");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feelings: selectedFeelings,
          rating,
          notes: notes.trim() || undefined,
          localDate: format(new Date(), "yyyy-MM-dd"),
        }),
      });

      if (!res.ok) throw new Error("Failed to save mood");

      // Reset form
      setSelectedFeelings([]);
      setRating(5);
      setNotes("");
      alert("Mood logged successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to save mood");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 bg-white">
      <h3 className="text-sm font-bold text-black mb-2">How are you feeling today?</h3>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Feelings */}
        <div>
          <label className="text-xs font-semibold text-black mb-1 block">
            Feelings (select one or more):
          </label>
          <div className="flex flex-wrap gap-1">
            {FEELINGS.map((feeling) => (
              <button
                key={feeling}
                type="button"
                onClick={() => toggleFeeling(feeling)}
                className={`px-2 py-0.5 text-xs border border-black ${
                  selectedFeelings.includes(feeling)
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                {feeling}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="text-xs font-semibold text-black mb-1 block">
            Rating: {rating}/10
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-black mt-0.5">
            <span>0</span>
            <span>10</span>
          </div>
        </div>

        {/* Notes and Submit in row */}
        <div className="flex gap-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes..."
            className="flex-1 border border-black px-2 py-1 text-xs text-black bg-white focus:outline-none focus:ring-0 min-h-[40px]"
          />
          <button
            type="submit"
            disabled={isSubmitting || selectedFeelings.length === 0}
            className="border border-black px-3 py-1 text-xs text-black bg-white hover:bg-black hover:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSubmitting ? "Saving..." : "Log"}
          </button>
        </div>
      </form>
    </div>
  );
}
