import type { NextConfig } from "next";

// Set PAGES_BASE_PATH (e.g. /LatentDisturbance) to build a static export for GitHub Pages.
// The prefix is applied through Vite's `base` and the `asset()` helper rather than
// Next's `basePath`, which vinext's static export does not prerender correctly.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(basePath ? { output: "export", trailingSlash: true } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
