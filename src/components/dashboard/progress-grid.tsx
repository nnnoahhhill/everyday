"use client";

import { useState } from "react";
import { useGrid } from "@/hooks/use-tide";
import { format, subDays, addDays, eachDayOfInterval, parse } from "date-fns";
import { Grid3x3, TrendingUp } from "lucide-react";

export default function ProgressGrid({ initialViewMode }: { initialViewMode?: "grid" | "graph" }) {
  const [viewMode, setViewMode] = useState<"grid" | "graph">(initialViewMode || "grid");
  // Default to 30 days starting from today
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 29), "yyyy-MM-dd")); // 30 days total (today + 29 more)
  
  const start = parse(startDate, "yyyy-MM-dd", new Date());
  const end = parse(endDate, "yyyy-MM-dd", new Date());
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const { data: gridData, isLoading } = useGrid(startStr, endStr);
  
  // Check if user has any logged data
  const hasAnyData = gridData && gridData.some((task: any) => task.logs && task.logs.length > 0);
  
  // Always use the full date range
  const days = eachDayOfInterval({ start, end });
  const effectiveDays = days; // Always show full range

  // Calculate completion percentage for each day
  const completionData = effectiveDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    
    if (!gridData || gridData.length === 0) {
      return { date: dateStr, percentage: 0 };
    }

    let totalTasks = gridData.length;
    let completed = 0;

    gridData.forEach((task: any) => {
      const log = task.logs?.find((l: any) => {
        if (!l.localDate) return false;
        const logDate = typeof l.localDate === 'string' 
          ? l.localDate.split('T')[0] 
          : format(new Date(l.localDate), "yyyy-MM-dd");
        return logDate === dateStr;
      });
      
      if (log?.status === "DONE") {
        completed += 1;
      } else if (log?.status === "PARTIAL") {
        completed += 0.5;
      }
    });

    return {
      date: dateStr,
      percentage: totalTasks > 0 ? (completed / totalTasks) * 100 : 0,
    };
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-black">
          <h2 className="text-xl font-bold text-black">Progress</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-black">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-black">Progress</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 border border-black ${
                viewMode === "grid" ? "bg-black text-white" : "bg-white text-black"
              } hover:bg-black hover:text-white`}
              title="Grid View"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`p-2 border border-black ${
                viewMode === "graph" ? "bg-black text-white" : "bg-white text-black"
              } hover:bg-black hover:text-white`}
              title="Line Graph View"
            >
              <TrendingUp size={18} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <label className="text-sm text-black">
            Start:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ml-2 border border-black px-2 py-1 text-black"
            />
          </label>
          <label className="text-sm text-black">
            End:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="ml-2 border border-black px-2 py-1 text-black"
            />
          </label>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === "grid" ? (
          <div className="space-y-3">
            {gridData && gridData.length > 0 ? (
              <>
                {/* Grid with labels on left */}
                <div className="space-y-1">
                  {gridData.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <span 
                        className="text-xs font-bold text-black w-32 flex-shrink-0 text-right truncate"
                        title={task.name}
                      >
                        {task.name}
                      </span>
                      <div className="flex gap-0.5 flex-1 min-w-0">
                        {effectiveDays.map((day) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const dayDate = format(day, "yyyy-MM-dd");
                          const log = task.logs?.find((l: any) => {
                            if (!l.localDate) return false;
                            const logDate = typeof l.localDate === 'string' 
                              ? l.localDate.split('T')[0] 
                              : format(new Date(l.localDate), "yyyy-MM-dd");
                            return logDate === dayDate;
                          });
                          const status = log?.status;
                          const isDone = status === "DONE";
                          const isPartial = status === "PARTIAL";

                          return (
                            <div
                              key={dateStr}
                              className={`flex-shrink-0 w-5 h-5 border border-black ${
                                isDone ? "bg-green-600" : isPartial ? "bg-green-100" : "bg-white"
                              }`}
                              title={`${dateStr}: ${status || "Missed"}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Curved line graph below */}
                <div className="mt-6 border-t border-black pt-4">
                  <div className="text-sm font-bold text-black mb-2">Daily Completion (0-100%)</div>
                  <div className="relative border border-black flex justify-center" style={{ height: "200px" }}>
                    <svg width="60%" height="100%" viewBox={`0 0 ${Math.max(800, effectiveDays.length * 20)} 200`} preserveAspectRatio="xMidYMid meet">
                      {/* Y-axis labels */}
                      {[0, 25, 50, 75, 100].map((val) => {
                        const yPos = 180 - (val / 100) * 170;
                        return (
                          <g key={val}>
                            <line
                              x1="40"
                              y1={yPos}
                              x2="100%"
                              y2={yPos}
                              stroke="#e5e5e5"
                              strokeWidth="1"
                            />
                            <text
                              x="35"
                              y={yPos}
                              textAnchor="end"
                              className="text-xs fill-black"
                              dominantBaseline="middle"
                            >
                              {val}%
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Curved line graph using quadratic bezier curves */}
                      {completionData.length > 1 && (
                        <path
                          d={`M ${completionData.map((d, i) => {
                            const x = 40 + (i / (completionData.length - 1)) * (Math.max(800, days.length * 20) - 80);
                            const y = 130 - (d.percentage / 100) * 120;
                            return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      
                      {/* Smooth curved line using cubic bezier */}
                      {completionData.length > 1 && (
                        <path
                          d={(() => {
                            const points = completionData.map((d, i) => {
                              const x = 40 + (i / (completionData.length - 1)) * (Math.max(800, effectiveDays.length * 20) - 80);
                              const y = 180 - (d.percentage / 100) * 170;
                              return { x, y };
                            });
                            
                            if (points.length < 2) return '';
                            
                            let path = `M ${points[0].x},${points[0].y}`;
                            
                            for (let i = 0; i < points.length - 1; i++) {
                              const curr = points[i];
                              const next = points[i + 1];
                              const prev = points[i - 1] || curr;
                              const after = points[i + 2] || next;
                              
                              // Calculate control points for smooth curve
                              const cp1x = curr.x + (next.x - prev.x) * 0.2;
                              const cp1y = curr.y + (next.y - prev.y) * 0.2;
                              const cp2x = next.x - (after.x - curr.x) * 0.2;
                              const cp2y = next.y - (after.y - curr.y) * 0.2;
                              
                              path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
                            }
                            
                            return path;
                          })()}
                          fill="none"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      
                      {/* Data points */}
                      {completionData.map((d, i) => {
                        const x = 40 + (i / Math.max(completionData.length - 1, 1)) * (Math.max(800, effectiveDays.length * 20) - 80);
                        const y = 180 - (d.percentage / 100) * 170;
                        return (
                          <circle
                            key={d.date}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="black"
                          >
                            <title>{`${d.date}: ${d.percentage.toFixed(1)}%`}</title>
                          </circle>
                        );
                      })}
                      
                      {/* X-axis date labels */}
                      {completionData.map((d, i) => {
                        if (i % Math.ceil(completionData.length / 10) !== 0 && i !== completionData.length - 1) return null;
                        const x = 40 + (i / Math.max(completionData.length - 1, 1)) * (Math.max(800, effectiveDays.length * 20) - 80);
                        return (
                          <text
                            key={d.date}
                            x={x}
                            y={145}
                            textAnchor="middle"
                            className="text-xs fill-black"
                          >
                            {format(new Date(d.date), "M/d")}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-black mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-black py-8">
                <p>No tasks yet. Create tasks to see progress.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-black mb-4">
              Completion percentage over time (PARTIAL = 50%)
            </div>
            <div className="relative border border-black" style={{ height: "300px", width: "100%" }}>
              <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                {/* Y-axis labels */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const yPos = 280 - (val / 100) * 260;
                  return (
                    <g key={val}>
                      <line
                        x1="50"
                        y1={yPos}
                        x2="780"
                        y2={yPos}
                        stroke="#e5e5e5"
                        strokeWidth="1"
                      />
                      <text
                        x="45"
                        y={yPos}
                        textAnchor="end"
                        className="text-xs fill-black"
                        dominantBaseline="middle"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}
                
                {/* Line graph */}
                {completionData.length > 1 && (
                  <polyline
                    points={completionData.map((d, i) => {
                      const x = 50 + (i / (completionData.length - 1)) * 730;
                      const y = 280 - (d.percentage / 100) * 260;
                      return `${x},${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="black"
                    strokeWidth="2"
                  />
                )}
                
                {/* Data points */}
                {completionData.map((d, i) => {
                  const x = 50 + (i / Math.max(completionData.length - 1, 1)) * 730;
                  const y = 280 - (d.percentage / 100) * 260;
                  return (
                    <circle
                      key={d.date}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="black"
                    >
                      <title>{`${d.date}: ${d.percentage.toFixed(1)}%`}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>
            <div className="text-xs text-black mt-2">
              {completionData.length} days shown
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
