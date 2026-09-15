import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@photomatcher/types",
    "@photomatcher/color-engine",
    "@photomatcher/api-client",
  ],
};

export default nextConfig;
