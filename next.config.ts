import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  /* config options here */
  turbopack: {
    // Constrain Turbopack to this workspace to silence multi-lockfile warning
    root: __dirname,
  },
};

export default nextConfig;
