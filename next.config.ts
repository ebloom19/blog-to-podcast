import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("chrome-aws-lambda");
    }
    return config;
  },
};

export default nextConfig;
