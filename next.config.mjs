/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  devIndicators: false,

  allowedDevOrigins: ['172.31.208.1'],
}

export default nextConfig