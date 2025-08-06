import type { ThemeContextType } from "@/contexts/ThemeContextDef";
import { ThemeContext } from "@/contexts/ThemeContextDef";
import { useContext } from "react";

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
