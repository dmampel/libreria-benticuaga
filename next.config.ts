import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["unalphabetic-lachlan-depressingly.ngrok-free.dev"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

export default nextConfig
