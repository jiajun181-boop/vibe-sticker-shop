import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

// 这里定义谁可以上传，以及上传什么文件
export const ourFileRouter = {
  // 定义一个叫 "imageUploader" 的上传路线
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      // 上传成功后，在后台打印一下文件的下载链接
      console.log("Upload complete! File URL:", file.url);
      return { uploadedBy: "user" };
    }),
};