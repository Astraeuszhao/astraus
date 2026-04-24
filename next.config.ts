import type { NextConfig } from "next";

// Get the domain from the BLOB_BASE_URL environment variable
const blobBaseUrl = process.env.BLOB_BASE_URL;
const blobDomain = blobBaseUrl
  ? new URL(blobBaseUrl).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    domains: blobDomain ? [blobDomain] : [],
  },
};

export default nextConfig;
