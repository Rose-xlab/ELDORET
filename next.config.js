// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'corruptionkenya.s3.ap-south-1.amazonaws.com',
      'ui-avatars.com'
    ]
  }
};

export default nextConfig;
