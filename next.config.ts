import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  allowedDevOrigins: ['*'],
};

export default nextConfig;
