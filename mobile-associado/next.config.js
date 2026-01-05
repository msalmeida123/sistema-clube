/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Para build Docker (standalone)
  ...(process.env.DOCKER_BUILD === 'true' && {
    output: 'standalone',
  }),
}

module.exports = nextConfig
