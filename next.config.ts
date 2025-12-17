import type { NextConfig } from "next";

const nextConfig: NextConfig & { serverActions?: { bodySizeLimit?: string | number } } = {
  /* config options here */
  // Increase the Server Actions body size limit to allow larger uploads from forms.
  // Adjust the value as needed (e.g. '16mb', '50mb', or a number of bytes).
  serverActions: {
    bodySizeLimit: '16mb',
  },
};

export default nextConfig;

