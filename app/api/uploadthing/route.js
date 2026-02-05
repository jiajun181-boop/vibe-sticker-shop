import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const runtime = 'edge';

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // 👇 我们直接把密码写在这里，跳过环境变量检查！
    token: "eyJhcGlLZXkiOiJza19saXZlXzI3ZDRjMmM3ZDFkZTA1MDE2ZmYyNjBjNmQxOGZlNTBjNWU4ZmMxYzA1NDE1MTFlYjZhMmYwMmYwZGJiZThmZTgiLCJhcHBJZCI6InVqcHNhdWV0ODkiLCJyZWdpb25zIjpbInNlYTEiXX0=",
  },
});