"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "slatepic-theme";
const themeListeners = new Set<() => void>();

function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

function applyThemeToDom(next: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Ignore storage restriction errors
  }
  for (const listener of themeListeners) {
    listener();
  }
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within QueryProvider.");
  }
  return ctx;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const setTheme = useCallback((next: ThemeMode) => {
    applyThemeToDom(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = getThemeSnapshot();
    applyThemeToDom(current === "light" ? "dark" : "light");
  }, []);

  const themeValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={themeValue}>
        {children}
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
