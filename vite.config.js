import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
    root: ".", // Ensure Vite recognizes the correct root directory
    build: {
        outDir: "dist",
        assetsDir: "assets",
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
});
