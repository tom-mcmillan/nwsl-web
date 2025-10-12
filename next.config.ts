import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Constrain Turbopack to this workspace to silence multi-lockfile warning
    root: __dirname,
  },
};

export default nextConfig;
