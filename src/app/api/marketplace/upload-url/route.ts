import { randomUUID } from "node:crypto";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import {
  getMarketplaceWriteAuth,
  getMarketplaceWriteTokenHeaderName,
  validateOrigin
} from "@/lib/marketplace-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const DEFAULT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_IMAGE_PREFIX = "marketplace/images";
const SIGNED_UPLOAD_TTL_SECONDS = 60;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
]);

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

export async function POST(request: Request) {
  const auth = getMarketplaceWriteAuth(request);
  if (!auth.allowed) {
    return NextResponse.json(
      {
        error: "Write access denied",
        details: `Provide ${getMarketplaceWriteTokenHeaderName()} header`
      },
      { status: 401 }
    );
  }

  const originCheck = validateOrigin(request);
  if (!originCheck.valid) {
    return NextResponse.json(
      { error: "Invalid origin", origin: originCheck.origin },
      { status: 403 }
    );
  }

  const rateLimit = checkRateLimit(`marketplace:upload:${getClientIp(request)}`, {
    limit: Number.parseInt(process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX || "10", 10),
    windowMs: Number.parseInt(process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS || "60000", 10)
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfterSeconds: rateLimit.retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const payload = await request.json().catch(() => null);
  const filename = typeof payload?.filename === "string" ? payload.filename.trim() : "";
  const contentType =
    typeof payload?.contentType === "string" ? payload.contentType.trim().toLowerCase() : "";
  const size = parsePayloadSize(payload?.size);

  const config = getUploadConfig();
  if (!config.ok) {
    return NextResponse.json({ error: config.error }, { status: 500 });
  }

  const validationErrors: string[] = [];
  if (!filename) validationErrors.push("filename is required");
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    validationErrors.push("contentType must be one of: image/jpeg, image/png, image/webp, image/avif");
  }
  if (!Number.isFinite(size) || size <= 0) validationErrors.push("size must be a positive number");
  if (Number.isFinite(size) && size > config.maxBytes) {
    validationErrors.push(`file size exceeds maxBytes (${config.maxBytes})`);
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        errors: validationErrors,
        maxBytes: config.maxBytes
      },
      { status: 400 }
    );
  }

  const extension = resolveFileExtension(filename, contentType);
  const key = buildObjectKey(config.prefix, extension);
  const publicUrl = `${config.publicBase}/${key}`;

  try {
    const client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable"
    });
    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: SIGNED_UPLOAD_TTL_SECONDS
    });

    return NextResponse.json({
      key,
      uploadUrl,
      publicUrl,
      maxBytes: config.maxBytes,
      expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS
    });
  } catch (error) {
    console.error("Failed to generate marketplace upload URL", error);
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 });
  }
}

function parsePayloadSize(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  return Number.NaN;
}

function resolveFileExtension(filename: string, contentType: string) {
  const fromType = EXTENSION_BY_TYPE[contentType];
  if (fromType) return fromType;

  const extension = path.extname(filename).replace(/^\./, "").toLowerCase();
  if (extension && /^[a-z0-9]{2,5}$/.test(extension)) {
    return extension;
  }
  return "img";
}

function buildObjectKey(prefix: string, extension: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${prefix}/${yyyy}/${mm}/${dd}/${randomUUID()}.${extension}`;
}

function getUploadConfig():
  | {
      ok: true;
      bucket: string;
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      publicBase: string;
      prefix: string;
      maxBytes: number;
    }
  | { ok: false; error: string } {
  const bucket = process.env.R2_BUCKET?.trim() || "";
  const rawEndpoint = process.env.R2_ENDPOINT?.trim() || "";
  const endpoint = normalizeEndpoint(rawEndpoint, bucket);
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const publicBase =
    normalizeUrlBase(process.env.MARKETPLACE_IMAGE_PUBLIC_BASE?.trim()) ||
    normalizeUrlBase(process.env.R2_PUBLIC_BASE?.trim());
  const prefix = normalizePrefix(process.env.MARKETPLACE_IMAGE_PREFIX?.trim() || DEFAULT_IMAGE_PREFIX);
  const maxBytes = parseMaxBytes(process.env.MARKETPLACE_IMAGE_MAX_BYTES);

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey || !publicBase) {
    return {
      ok: false,
      error:
        "Marketplace image upload is not configured. Set R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_BASE (or MARKETPLACE_IMAGE_PUBLIC_BASE)."
    };
  }

  return {
    ok: true,
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
    publicBase,
    prefix,
    maxBytes
  };
}

function normalizeEndpoint(endpoint: string, bucket: string) {
  let value = normalizeUrlBase(endpoint);
  if (!value || !bucket) return value;
  const suffix = `/${bucket}`;
  if (value.endsWith(suffix)) {
    value = value.slice(0, -suffix.length);
  }
  return value;
}

function normalizeUrlBase(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function normalizePrefix(value: string) {
  const normalized = value.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized || DEFAULT_IMAGE_PREFIX;
}

function parseMaxBytes(value: string | undefined) {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_IMAGE_MAX_BYTES;
  return parsed;
}
