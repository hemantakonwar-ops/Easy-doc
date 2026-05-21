"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "legalai-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check local storage or system preference
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      // Default to dark theme
      setThemeState("dark");
      applyTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme, mounted]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === "dark") {
      // VS Code Dark Theme
      root.style.setProperty("--vscode-bg", "#1e1e1e");
      root.style.setProperty("--vscode-sidebar", "#252526");
      root.style.setProperty("--vscode-activity", "#181818");
      root.style.setProperty("--vscode-border", "#2d2d2d");
      root.style.setProperty("--vscode-text", "#d4d4d4");
      root.style.setProperty("--vscode-text-muted", "#858585");
      root.style.setProperty("--vscode-accent", "#007acc");
      root.style.setProperty("--vscode-accent-hover", "#1177bb");
      root.style.setProperty("--vscode-selection", "#264f78");
      root.style.setProperty("--vscode-hover", "#2a2d2e");
      root.style.setProperty("--vscode-input", "#3c3c3c");
      root.style.setProperty("--vscode-error", "#f48771");
      root.style.setProperty("--vscode-warning", "#cca700");
      root.style.setProperty("--vscode-success", "#89d185");
    } else {
      // Light Theme (Clean, minimal)
      root.style.setProperty("--vscode-bg", "#ffffff");
      root.style.setProperty("--vscode-sidebar", "#f8f9fa");
      root.style.setProperty("--vscode-activity", "#f1f3f4");
      root.style.setProperty("--vscode-border", "#dadce0");
      root.style.setProperty("--vscode-text", "#202124");
      root.style.setProperty("--vscode-text-muted", "#5f6368");
      root.style.setProperty("--vscode-accent", "#1a73e8");
      root.style.setProperty("--vscode-accent-hover", "#1557b0");
      root.style.setProperty("--vscode-selection", "#e8f0fe");
      root.style.setProperty("--vscode-hover", "#e8eaed");
      root.style.setProperty("--vscode-input", "#ffffff");
      root.style.setProperty("--vscode-error", "#d93025");
      root.style.setProperty("--vscode-warning", "#f9ab00");
      root.style.setProperty("--vscode-success", "#188038");
    }
    
    // Set data attribute for any CSS that uses it
    root.setAttribute("data-theme", newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
