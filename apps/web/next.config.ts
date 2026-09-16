import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@photomatcher/types",
    "@photomatcher/color-engine",
    "@photomatcher/api-client",
  ],
  serverExternalPackages: ["@mediapipe/tasks-vision"],
};

export default nextConfig;
