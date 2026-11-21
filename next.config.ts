import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/registry/**": ["./registry/**/*"],
  },
};


export default nextConfig;
