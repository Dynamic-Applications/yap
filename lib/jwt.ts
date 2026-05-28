import { jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";
import { isTokenBlacklisted } from "./tokenBlacklist";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const encoder = new TextEncoder();
const jwtSecretKey = encoder.encode(JWT_SECRET);

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(jwtSecretKey);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (await isTokenBlacklisted(token)) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getTokenFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return await verifyToken(authHeader.slice(7));
  }
  const cookie = req.cookies.get("auth_token")?.value;
  if (cookie) return await verifyToken(cookie);
  return null;
}

export function makeAuthCookie(token: string): string {
  const maxAge = 60 * 60 * 24 * 7;
  return `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearAuthCookie(): string {
  return `auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}