import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/matches',
        destination: '/dashboard/sessions?view=matches',
        permanent: true,
      },
      {
        source: '/dashboard/calendar',
        destination: '/dashboard/sessions?view=calendar',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
