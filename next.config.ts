import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Envoi d'images haute définition depuis le back-office
      bodySizeLimit: "25mb",
    },
  },
  images: {
    localPatterns: [{ pathname: "/uploads/**" }],
    qualities: [75, 90],
  },
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
