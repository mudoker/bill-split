'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResizableSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  storageKey?: string;
}

export function ResizableSplit({
  left,
  right,
  defaultLeftPercent = 38,
  minLeftPercent = 25,
  maxLeftPercent = 55,
  storageKey = 'ledger_left_col_width',
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState<number>(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState(false);

  // Restore saved column width from localStorage
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const val = parseFloat(saved);
          if (!isNaN(val) && val >= minLeftPercent && val <= maxLeftPercent) {
            setLeftPercent(val);
          }
        }
      } catch {
        // Ignore storage access errors
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [storageKey, minLeftPercent, maxLeftPercent]);

  const updateWidth = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPercent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(minLeftPercent, Math.min(maxLeftPercent, rawPercent));
      setLeftPercent(clamped);
      try {
        localStorage.setItem(storageKey, clamped.toFixed(1));
      } catch {
        // Ignore
      }
    },
    [minLeftPercent, maxLeftPercent, storageKey]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleDoubleClick = () => {
    setLeftPercent(defaultLeftPercent);
    try {
      localStorage.setItem(storageKey, defaultLeftPercent.toString());
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      updateWidth(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        updateWidth(e.touches[0].clientX);
      }
    };

    const onEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, updateWidth]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full w-full overflow-hidden select-none",
        isDragging && "cursor-col-resize select-none"
      )}
    >
      {/* Left Column (Participants) */}
      <div
        style={{ width: `${leftPercent}%` }}
        className="h-full overflow-hidden flex flex-col shrink-0 pr-2 min-h-0"
      >
        {left}
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize columns (double click to reset)"
        className={cn(
          "w-5 shrink-0 flex items-center justify-center cursor-col-resize z-20 group relative select-none",
          isDragging ? "cursor-col-resize" : ""
        )}
      >
        {/* Subtle vertical line */}
        <div
          className={cn(
            "w-[2px] h-full transition-colors rounded-full",
            isDragging
              ? "bg-foreground"
              : "bg-foreground/10 group-hover:bg-foreground/40"
          )}
        />
        {/* Pill handle icon */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-9 rounded-full border flex items-center justify-center bg-background shadow-md transition-all pointer-events-none",
            isDragging
              ? "border-foreground text-foreground scale-110 shadow-black/20"
              : "border-foreground/15 text-muted-foreground group-hover:border-foreground/40 group-hover:text-foreground"
          )}
        >
          <GripVertical className="w-3 h-3 stroke-[2.5]" />
        </div>
      </div>

      {/* Right Column (Items - Main) */}
      <div
        style={{ width: `calc(${100 - leftPercent}% - 1.25rem)` }}
        className="h-full overflow-hidden flex flex-col flex-1 min-w-0 pl-2 min-h-0"
      >
        {right}
      </div>
    </div>
  );
}
