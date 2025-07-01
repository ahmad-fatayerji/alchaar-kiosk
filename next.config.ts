import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⚠️  Allows the production build to finish even if ESLint errors exist
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;