import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: () => ({
        manifest_version: 3,
        name: "MarketMate",
        version: "0.1.0",
        description: "Automate price negotiation on Facebook Marketplace",
        permissions: ["storage", "activeTab"],
        host_permissions: [
          "https://www.facebook.com/*",
          "https://www.messenger.com/*"
        ],
        background: {
          service_worker: "src/background/index.ts",
          type: "module"
        },
        content_scripts: [
          {
            matches: ["https://www.facebook.com/marketplace/*"],
            js: ["src/content/index.tsx"],
            css: ["src/styles/panel.css"],
            run_at: "document_idle"
          },
          {
            matches: ["https://www.messenger.com/*"],
            js: ["src/messenger/index.tsx"],
            css: ["src/styles/messenger.css"],
            run_at: "document_idle"
          }
        ],
        action: {
          default_popup: "src/popup/index.html",
          default_icon: {
            "16": "public/icons/icon.svg",
            "48": "public/icons/icon.svg",
            "128": "public/icons/icon.svg"
          }
        },
        icons: {
          "16": "public/icons/icon.svg",
          "48": "public/icons/icon.svg",
          "128": "public/icons/icon.svg"
        },
        web_accessible_resources: [
          {
            resources: ["assets/*"],
            matches: ["https://www.facebook.com/*", "https://www.messenger.com/*"]
          }
        ]
      }),
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
