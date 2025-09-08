declare module "@vitejs/plugin-react-swc" {
  import type { PluginOption } from "vite";
  export default function react(
    options?: Record<string, unknown>
  ): PluginOption;
}

declare module "@tailwindcss/vite" {
  import type { PluginOption } from "vite";
  const plugin: () => PluginOption;
  export default plugin;
}

declare module "vite" {
  export type PluginOption = any;
  export function defineConfig(config: any): any;
}

// Minimal JSX fallbacks to prevent TS7026 when React types are missing
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
