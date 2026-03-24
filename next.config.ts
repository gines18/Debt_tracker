import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"], // Better image compression
    minimumCacheTTL: 60 * 60 * 24 * 30,   // Cache images for 30 days
  },
};

export default nextConfig;