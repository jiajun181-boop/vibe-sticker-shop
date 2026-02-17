import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAdminSession } from "@/lib/admin-auth";
import { getClientIp, uploadLimiter } from "@/lib/rate-limit";

const f = createUploadthing();

async function requireAuthenticatedUpload({ req }) {
  const ip = getClientIp(req);
  const { success } = uploadLimiter.check(ip);
  if (!success) {
    throw new UploadThingError("Too many upload attempts. Please try again later.");
  }

  try {
    const userSession = getSessionFromRequest(req);
    if (userSession?.userId) {
      return { uploadedBy: userSession.userId, role: "user" };
    }
  } catch {
    // If SESSION_SECRET is missing, user session validation is unavailable.
  }

  const adminSession = await getAdminSession(req);
  if (adminSession.authenticated && adminSession.user?.id) {
    return { uploadedBy: adminSession.user.id, role: "admin" };
  }

  throw new UploadThingError("Unauthorized");
}

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireAuthenticatedUpload)
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata?.uploadedBy };
    }),

  artworkUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(requireAuthenticatedUpload)
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata?.uploadedBy };
    }),
};
