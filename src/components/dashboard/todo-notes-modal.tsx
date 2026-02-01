"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { format } from "date-fns";

interface TodoNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoItemId: string;
}

export default function TodoNotesModal({ isOpen, onClose, todoItemId }: TodoNotesModalProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && todoItemId) {
      fetchNotes();
    }
  }, [isOpen, todoItemId]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/todo-items/${todoItemId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes", error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/todo-items/${todoItemId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (res.ok) {
        setNewNote("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Failed to add note", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-black" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="text-xl font-bold text-black">Notes History</h2>
          <button
            onClick={onClose}
            className="text-black hover:bg-black hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full border border-black p-2 text-black bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newNote.trim() || isLoading}
              className="w-full border border-black px-4 py-2 text-black bg-white hover:bg-black hover:text-white disabled:opacity-50"
            >
              <Plus size={16} className="inline mr-1" />
              Add Note
            </button>
          </form>

          <div className="border-t border-black pt-4">
            <h3 className="text-sm font-bold text-black mb-2">History</h3>
            {notes.length === 0 ? (
              <p className="text-sm text-black">No notes yet</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border border-black p-3 bg-white">
                    <div className="text-xs text-black opacity-70 mb-1">
                      {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                    <div className="text-sm text-black whitespace-pre-wrap">{note.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
