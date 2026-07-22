import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@pymebot/core', '@pymebot/adapters', '@pymebot/agents', '@pymebot/db'],
  serverExternalPackages: ['@prisma/client', 'prisma'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
