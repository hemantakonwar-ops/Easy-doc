"use client";

import { X } from "lucide-react";
import { cn } from "../lib/utils/cn";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  position?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export default function SlidePanel({
  isOpen,
  onClose,
  title,
  position = "right",
  children,
  className,
}: SlidePanelProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 z-50 w-full sm:w-96 lg:w-auto lg:min-w-[320px] bg-white shadow-xl lg:shadow-none",
          "transition-transform duration-300 ease-out",
          position === "right" ? "right-0" : "left-0",
          isOpen
            ? "translate-x-0"
            : position === "right"
            ? "translate-x-full lg:translate-x-0 lg:hidden"
            : "-translate-x-full lg:translate-x-0 lg:hidden",
          "lg:block lg:rounded-xl lg:border lg:border-gray-200 lg:overflow-hidden",
          className
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </>
  );
}
