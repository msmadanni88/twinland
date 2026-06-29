/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: '/api/tiles/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    }]
  },
}
module.exports = nextConfig
