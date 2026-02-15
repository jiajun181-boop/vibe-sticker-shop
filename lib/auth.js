import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET env var is required");
  return s;
}

export function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verify(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export function setSessionCookie(response, userId, email) {
  const token = sign({ userId, email, iat: Math.floor(Date.now() / 1000) });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export function getSessionFromRequest(request) {
  const cookie = request.cookies.get(SESSION_COOKIE);
  if (!cookie?.value) return null;
  return verify(cookie.value);
}

export async function getUserFromRequest(request) {
  const session = getSessionFromRequest(request);
  if (!session?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      accountType: true,
      emailVerified: true,
      b2bApproved: true,
      companyName: true,
      companyRole: true,
      createdAt: true,
    },
  });
  return user;
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export { SESSION_COOKIE };
