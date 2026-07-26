import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Білий список доменів для безпечного завантаження картинок */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "://unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /* Твоя Wasm-сумісність для Prisma 7 та MongoDB Atlas */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.experiments = {
        ...config.experiments,
        layers: true,
      };
    }
    return config;
  },
};

export default nextConfig;
