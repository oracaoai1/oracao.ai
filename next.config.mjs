/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/biblioteca-espiritual",
        destination: "/biblioteca-catolica",
        permanent: true,
      },
      {
        source: "/biblioteca-espiritual/:slug",
        destination: "/biblioteca-catolica/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
