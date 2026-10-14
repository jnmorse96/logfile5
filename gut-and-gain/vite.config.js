import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` serves the front end only (saved briefings work, live scans don't).
// Use `vercel dev` to run the /api functions locally as well.
export default defineConfig({
  plugins: [react()],
  // The 3D background (three.js) is a separate, lazily loaded chunk.
  build: { chunkSizeWarningLimit: 700 },
});
