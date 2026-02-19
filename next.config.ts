import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  qualities: [60, 70, 75, 80, 85, 90, 95, 100],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withNextIntl(nextConfig);
