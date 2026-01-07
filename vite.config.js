import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                contentScript: resolve(__dirname, "src/content/index.tsx"),
                messengerScript: resolve(__dirname, "src/messenger/index.tsx"),
                background: resolve(__dirname, "src/background/index.ts"),
                popup: resolve(__dirname, "src/popup/index.html"),
            },
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "chunks/[name].[hash].js",
                assetFileNames: "assets/[name].[ext]",
            },
        },
    },
    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },
});
