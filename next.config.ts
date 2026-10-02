import type { NextConfig } from 'next';
const config: NextConfig = {
  webpack(config) { config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false }; return config; },
  poweredByHeader: false,
};
export default config;
