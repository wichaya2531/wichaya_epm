/** @type {import('next').NextConfig} */
const nextConfig = {
    //output: 'export', // เพิ่มบรรทัดนี้เพื่อรองรับ Static Export
    //trailingSlash: true, // แนะนำให้ใส่เพื่อให้ URL ลงท้ายด้วย "/"


    reactStrictMode: false,
    // async rewrites() {
    //   return [
    //     {
    //       source: '/api-elastic/:path*',
    //       destination: 'http://10.171.104.22:9200/:path*' // Proxy to Backend
    //     }
    //   ];
    // }
    //  experimental: {
    //     serverActions: true, // ✅ ต้องเปิด
    // }
  };
  
  export default nextConfig;
  