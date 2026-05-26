import { Redis } from "@upstash/redis";

const isConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = isConfigured
    ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null;

declare global {
    var __blacklistedTokens: Set<string>;
}
if (!global.__blacklistedTokens) {
    global.__blacklistedTokens = new Set();
}

export async function blacklistToken(token: string): Promise<void> {
    if (redis) {
        await redis.set(`blacklist:${token}`, "1", { ex: 60 * 60 * 24 * 7 });
    } else {
        global.__blacklistedTokens.add(token);
    }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
    if (redis) {
        const val = await redis.get(`blacklist:${token}`);
        return val !== null;
    }
    return global.__blacklistedTokens.has(token);
}
