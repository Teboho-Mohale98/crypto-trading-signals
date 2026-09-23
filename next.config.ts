import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: PROJECT_ROOT,
  },
};

export default nextConfig;