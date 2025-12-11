import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Next.js App Router automatically handles multipart/form-data
  // No special configuration needed for file uploads
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tempfile.aiquickdraw.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
