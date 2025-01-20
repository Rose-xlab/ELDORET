// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['corruptionkenya.s3.ap-south-1.amazonaws.com'],
    domains: ['ui-avatars.com'], // Add ui-avatars.com to allowed domains

  },
};

export default nextConfig;
