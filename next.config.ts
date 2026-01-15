import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
        domains: [
      "avatars.githubusercontent.com",
      "unfdxueausqwhlaohxcp.supabase.co",
      "lh3.googleusercontent.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // allow your Supabase Storage images
      },
    ],
  },
};

export default withNextIntl(nextConfig);
