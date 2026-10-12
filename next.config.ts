import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Allow loading the dev server (and its HMR assets) from the LAN so the app
  // can be opened from another device during development. Entries are bare
  // hostnames only — no scheme or port. Use `192.168.1.*` if the IP changes.
  allowedDevOrigins: ["192.168.1.79"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
