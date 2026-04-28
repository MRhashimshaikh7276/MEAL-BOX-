/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
    output: 'export',   // 👈 ye add karo
    trailingSlash: true, 
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
