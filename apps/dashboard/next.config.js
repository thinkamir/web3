/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@alphaquest/ui', '@alphaquest/types'],
  server: {
    allowedHosts: ['.monkeycode-ai.online'],
  },
};

module.exports = nextConfig;
