import { useEffect, useState, type ReactNode } from "react";
import type { Theme } from "./ThemeContextDef";
import { ThemeContext } from "./ThemeContextDef";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("chat-app-theme");
    return (saved as Theme) || "light";
  });

  useEffect(() => {
    localStorage.setItem("chat-app-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
