import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io", // 允许 UploadThing 的图片
      },
      {
        protocol: "https",
        hostname: "img.clerk.com", // 预留给 Clerk 登录头像
      },
    ],
  },
};

export default nextConfig;