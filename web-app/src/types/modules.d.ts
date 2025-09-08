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
