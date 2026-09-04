import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...({
    allowedDevOrigins: ['192.168.88.23', '192.168.1.111', '192.168.1.105', '192.168.88.64', '172.20.10.5', '192.168.0.101', '192.168.1.107', '192.168.0.109']
  } as any),
};

export default nextConfig;