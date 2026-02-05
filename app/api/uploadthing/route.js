import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// 通行证
export const runtime = 'edge';

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});