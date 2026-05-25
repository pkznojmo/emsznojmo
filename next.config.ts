import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tímto přetypováním na 'any' donutíme TypeScript, aby nám dovolil zapsat
  // skryté dev nastavení, které po nás Turbopack tak vehementně vyžaduje.
  ...({
    allowedDevOrigins: ['192.168.1.111:3000', '192.168.1.111']
  } as any),
  
  experimental: {
    serverActions: true, // Zachováme zapnuté serverActions, které ti v logu svítily
  }
};

export default nextConfig;