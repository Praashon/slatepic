import { Redis } from "@upstash/redis";
import { connection, NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const fallbackStats = {
  imagesCleaned: 0,
  tagsNuked: 0,
  bytesSaved: 0,
};

function getRedisClient(): Redis | null {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return Redis.fromEnv();
  }
  return null;
}

function clampInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(10_000_000_000, Math.floor(parsed)));
}

function normalizeImageHash(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!/^[a-f0-9]{16,64}$/.test(trimmed)) return null;
  return trimmed;
}

export async function GET() {
  await connection();
  const redis = getRedisClient();

  if (redis) {
    try {
      const [imagesCleaned, tagsNuked, bytesSaved] = await Promise.all([
        redis.get<number>("slatepic:images_cleaned"),
        redis.get<number>("slatepic:ai_tags_nuked"),
        redis.get<number>("slatepic:bytes_saved"),
      ]);

      return NextResponse.json(
        {
          imagesCleaned: imagesCleaned ?? 0,
          tagsNuked: tagsNuked ?? 0,
          bytesSaved: bytesSaved ?? 0,
          source: "redis",
          updatedAt: Date.now(),
        },
        { headers: NO_STORE_HEADERS },
      );
    } catch {
      // Fall through to local fallback when Redis is unreachable
    }
  }

  return NextResponse.json(
    {
      ...fallbackStats,
      source: "fallback",
      updatedAt: Date.now(),
    },
    { headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, success: false, error: "Invalid JSON payload" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const count = clampInt(body.count, 1);
  const tagsCount = clampInt(body.tagsCount, 0);
  const bytesSavedCount = clampInt(body.bytesSavedCount, 0);
  const validHash = normalizeImageHash(body.imageHash);
  const timestamp = Date.now();

  const redis = getRedisClient();
  if (redis) {
    try {
      const operations: [
        Promise<number>,
        Promise<number>,
        Promise<number>,
        ...Promise<unknown>[],
      ] = [
        redis.incrby("slatepic:images_cleaned", count),
        redis.incrby("slatepic:ai_tags_nuked", tagsCount),
        redis.incrby("slatepic:bytes_saved", bytesSavedCount),
      ];

      if (validHash) {
        operations.push(
          redis.set(
            `slatepic:stat:${validHash}`,
            JSON.stringify({ timestamp, hash: validHash, processed: true }),
            { ex: 60 * 60 * 24 },
          ),
        );
      }

      const [imagesCleaned, tagsNuked, bytesSaved] =
        await Promise.all(operations);

      return NextResponse.json(
        {
          ok: true,
          success: true,
          source: "redis",
          imagesCleaned,
          tagsNuked,
          bytesSaved,
          hash: validHash,
          updatedAt: timestamp,
        },
        { headers: NO_STORE_HEADERS },
      );
    } catch {
      // Fall through to fallback store
    }
  }

  fallbackStats.imagesCleaned += count;
  fallbackStats.tagsNuked += tagsCount;
  fallbackStats.bytesSaved += bytesSavedCount;

  return NextResponse.json(
    {
      ok: true,
      success: true,
      source: "fallback",
      ...fallbackStats,
      hash: validHash,
      updatedAt: timestamp,
    },
    { headers: NO_STORE_HEADERS },
  );
}
