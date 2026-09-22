import type { NextConfig } from "next";

const appKey =
  process.env.NEXT_PUBLIC_APP_KEY ||
  process.env.APP_KEY ||
  process.env.NEXT_PUBLIC_MAKER_KEY ||
  "mk_bd2014546dba46b7858e3e2130d10a69";

const nextConfig: NextConfig = {
  env: {
    APP_KEY: appKey,
    NEXT_PUBLIC_APP_KEY: appKey,
    NEXT_PUBLIC_MAKER_KEY: appKey,
  },
};

export default nextConfig;

