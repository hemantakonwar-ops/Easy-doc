"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/theme";
import { cn } from "../lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
        "hover:scale-110 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-[var(--vscode-accent)] focus:ring-offset-2 focus:ring-offset-[var(--vscode-bg)]",
        sizeClasses[size],
        theme === "dark"
          ? "bg-[var(--vscode-hover)] text-[var(--vscode-text-muted)] hover:text-[var(--vscode-text)]"
          : "bg-[var(--vscode-hover)] text-[var(--vscode-text-muted)] hover:text-[var(--vscode-text)]",
        className
      )}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative">
        {/* Sun Icon */}
        <Sun
          className={cn(
            iconSizes[size],
            "absolute inset-0 transition-all duration-300",
            theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          )}
        />
        {/* Moon Icon */}
        <Moon
          className={cn(
            iconSizes[size],
            "transition-all duration-300",
            theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
          )}
        />
      </div>
    </button>
  );
}

// Alternative: Switch/Toggle style
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--vscode-accent)] focus:ring-offset-2 focus:ring-offset-[var(--vscode-bg)]",
        theme === "dark" ? "bg-[var(--vscode-input)]" : "bg-[var(--vscode-accent)]",
        className
      )}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="sr-only">
        {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      </span>
      <span
        className={cn(
          "absolute left-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300",
          theme === "dark" ? "translate-x-0" : "translate-x-7"
        )}
      >
        {theme === "dark" ? (
          <Moon className="w-3.5 h-3.5 text-[var(--vscode-bg)]" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[var(--vscode-accent)]" />
        )}
      </span>
      <span className="absolute left-2 text-[10px] font-medium text-white/50">
        {theme === "dark" && "🌙"}
      </span>
      <span className="absolute right-2 text-[10px] font-medium text-white/50">
        {theme === "light" && "☀️"}
      </span>
    </button>
  );
}
