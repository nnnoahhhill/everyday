import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Proxy Clerk requests to Clerk's servers
  async rewrites() {
    return [
      {
        source: "/clerk/:path*",
        destination: "https://clerk.clerk.accounts.dev/:path*",
      },
    ];
  },
};

export default nextConfig;
