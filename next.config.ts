import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "go.invamax.com",
          },
        ],
        destination: "https://app.hinex.vn/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
