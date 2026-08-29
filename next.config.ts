import type { NextConfig } from "next";

/**
 * Tunnel hostnames used to reach the dev server from a phone on the shop
 * floor, as a comma-separated DEV_TUNNEL_ORIGINS. They rotate every time the
 * tunnel restarts, so they are configuration rather than code.
 *
 * Unset in production: Vercel serves the app from its own origin, which Next
 * trusts without being told.
 */
const devTunnelOrigins = (process.env.DEV_TUNNEL_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(devTunnelOrigins.length > 0 && {
    allowedDevOrigins: devTunnelOrigins,
    experimental: {
      serverActions: {
        allowedOrigins: devTunnelOrigins,
      },
    },
  }),
};

export default nextConfig;
