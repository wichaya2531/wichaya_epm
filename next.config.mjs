/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    async rewrites() {
      return [
        {
          source: '/api-elastic/:path*',
          destination: 'http://10.171.104.22:9200/:path*' // Proxy to Backend
        }
      ];
    }
  };
  
  export default nextConfig;
  