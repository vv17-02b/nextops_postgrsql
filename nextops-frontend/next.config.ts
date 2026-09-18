import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Примусово вказуємо корінь проекту для трейсингу файлів Next.js 15
  outputFileTracingRoot: path.join(__dirname, '../../'),

  //  ДОДАНО: Перенаправлення всіх API запитів на NestJS бекенд (порт 3001)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
