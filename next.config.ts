import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...({
    allowedDevOrigins: ['192.168.1.111:3000', '192.168.1.111', '192.168.1.105', '192.168.88.64']
  } as any),
};

export default nextConfig;