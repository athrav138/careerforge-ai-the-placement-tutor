/** @type {import('next').NextConfig} */
const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || process.env.NEXT_DEPLOYMENT_ID;

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  ...(deploymentId ? { deploymentId } : {}),
};
export default nextConfig;
