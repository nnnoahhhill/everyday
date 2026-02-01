"use client";

import { useState, useEffect } from "react";

export default function ColorSettings() {
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");

  useEffect(() => {
    // Load saved colors
    const savedBg = localStorage.getItem("tide_bg_color") || "#ffffff";
    const savedText = localStorage.getItem("tide_text_color") || "#000000";
    setBgColor(savedBg);
    setTextColor(savedText);
    applyColors(savedBg, savedText);
  }, []);

  const applyColors = (bg: string, text: string) => {
    document.documentElement.style.setProperty("--tide-bg", bg);
    document.documentElement.style.setProperty("--tide-text", text);
    document.documentElement.style.setProperty("--tide-border", text);
    document.body.style.backgroundColor = bg;
    document.body.style.color = text;
    
    // Update all borders and text colors via CSS
    const style = document.createElement("style");
    style.id = "tide-color-override";
    style.textContent = `
      * { border-color: ${text} !important; }
      .bg-white { background-color: ${bg} !important; }
      .text-black { color: ${text} !important; }
      .border-black { border-color: ${text} !important; }
    `;
    const existing = document.getElementById("tide-color-override");
    if (existing) existing.remove();
    document.head.appendChild(style);
  };

  const handleBgChange = (color: string) => {
    setBgColor(color);
    localStorage.setItem("tide_bg_color", color);
    applyColors(color, textColor);
  };

  const handleTextChange = (color: string) => {
    setTextColor(color);
    localStorage.setItem("tide_text_color", color);
    applyColors(bgColor, color);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black">Color Settings</h3>
      
      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Background Color
        </label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => handleBgChange(e.target.value)}
          className="w-full h-10 border border-black cursor-pointer"
        />
        <input
          type="text"
          value={bgColor}
          onChange={(e) => handleBgChange(e.target.value)}
          className="w-full mt-2 border border-black px-3 py-2 text-black bg-white"
          placeholder="#ffffff"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-2">
          Text & Line Color
        </label>
        <input
          type="color"
          value={textColor}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full h-10 border border-black cursor-pointer"
        />
        <input
          type="text"
          value={textColor}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full mt-2 border border-black px-3 py-2 text-black bg-white"
          placeholder="#000000"
        />
      </div>

      <button
        onClick={() => {
          handleBgChange("#ffffff");
          handleTextChange("#000000");
        }}
        className="w-full border border-black px-4 py-2 text-black bg-white hover:bg-black hover:text-white"
      >
        Reset to Default
      </button>
    </div>
  );
}
