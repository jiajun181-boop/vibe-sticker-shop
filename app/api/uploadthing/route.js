import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// 导出 GET 和 POST 请求处理，让 UploadThing 能够接管这个 API 路径
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});