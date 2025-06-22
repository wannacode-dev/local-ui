/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: [
        {
          loader: 'string-replace-loader',
          options: {
            search: /[^\x00-\x7F]/g,
            replace: (match) => encodeURIComponent(match),
          },
        },
      ],
    });
    return config;
  },
}

module.exports = nextConfig 