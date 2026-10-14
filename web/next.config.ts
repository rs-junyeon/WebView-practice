import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Android 에뮬레이터 웹뷰(10.0.2.2)에서 HMR 등 dev 리소스 접근 허용
  allowedDevOrigins: ["10.0.2.2"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
