import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Білий список доменів для безпечного завантаження картинок */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /* Оновлений параметр конфігурації для стабільного Turbopack */
  turbopack: {
    // Ваші специфічні налаштування для Turbopack (якщо потрібні) можна писати сюди
  },

  /* Wasm-сумісність для Prisma та MongoDB Atlas під Webpack */
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
