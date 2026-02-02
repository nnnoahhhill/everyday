"use client";

import { useEffect } from "react";

export default function ColorPersist() {
  useEffect(() => {
    // Apply colors immediately on mount (before any rendering)
    const savedBg = localStorage.getItem("tide_bg_color") || "#ffffff";
    const savedText = localStorage.getItem("tide_text_color") || "#000000";
    
    // Apply colors to document
    document.documentElement.style.setProperty("--tide-bg", savedBg);
    document.documentElement.style.setProperty("--tide-text", savedText);
    document.documentElement.style.setProperty("--tide-border", savedText);
    document.body.style.backgroundColor = savedBg;
    document.body.style.color = savedText;
    
    // Update all borders and text colors via CSS
    const style = document.createElement("style");
    style.id = "tide-color-override";
    style.textContent = `
      * { border-color: ${savedText} !important; }
      .bg-white { background-color: ${savedBg} !important; }
      .text-black { color: ${savedText} !important; }
      .border-black { border-color: ${savedText} !important; }
    `;
    const existing = document.getElementById("tide-color-override");
    if (existing) existing.remove();
    document.head.appendChild(style);
  }, []);

  return null;
}
