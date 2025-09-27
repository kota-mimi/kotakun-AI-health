import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedOrigins: ['kotakun-health.ngrok.io'],
  },
};

export default nextConfig;
