/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // o simulado ADS virou o painel de estágios de Canoas
  async redirects() {
    return [{ source: '/simulado-ads', destination: '/estagio-ads', permanent: true }]
  },
}

module.exports = nextConfig
