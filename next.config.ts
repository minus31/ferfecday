import type { NextConfig } from "next";
import aitDevtools from "@apps-in-toss/devtools/unplugin";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "export",
  webpack(config, { dev }) {
    config.resolve.alias["local-test-account-runtime"] = path.resolve(
      process.cwd(),
      process.env.NEXT_PUBLIC_LOCAL_TEST_ACCOUNT === "true"
        ? "lib/local-test-account.ts"
        : "lib/local-test-account-runtime.ts",
    );
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
