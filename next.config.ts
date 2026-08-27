import type { NextConfig } from "next";
import aitDevtools from "@apps-in-toss/devtools/unplugin";

const nextConfig: NextConfig = {
  output: "export",
  webpack(config, { dev }) {
    if (dev) {
      config.plugins.unshift(
        aitDevtools.webpack({
          panel: false,
          sdkVersion: "3",
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
