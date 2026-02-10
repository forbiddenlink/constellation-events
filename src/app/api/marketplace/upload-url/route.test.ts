import { afterEach, describe, expect, it, vi } from "vitest";

const getSignedUrlMock = vi.fn();
const s3ClientConfigMock = vi.fn();
const putObjectInputMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    constructor(config: unknown) {
      s3ClientConfigMock(config);
    }
  }

  class PutObjectCommand {
    constructor(input: unknown) {
      putObjectInputMock(input);
    }
  }

  return { S3Client, PutObjectCommand };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args)
}));

async function loadRoute(options?: {
  writeToken?: string;
  bucket?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBase?: string;
  imagePrefix?: string;
  maxBytes?: string;
}) {
  vi.resetModules();
  setEnv("MARKETPLACE_WRITE_TOKEN", options?.writeToken);
  setEnv("R2_BUCKET", options?.bucket);
  setEnv("R2_ENDPOINT", options?.endpoint);
  setEnv("R2_ACCESS_KEY_ID", options?.accessKeyId);
  setEnv("R2_SECRET_ACCESS_KEY", options?.secretAccessKey);
  setEnv("R2_PUBLIC_BASE", options?.publicBase);
  setEnv("MARKETPLACE_IMAGE_PREFIX", options?.imagePrefix);
  setEnv("MARKETPLACE_IMAGE_MAX_BYTES", options?.maxBytes);
  return import("./route");
}

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe("marketplace upload-url route", () => {
  afterEach(() => {
    delete process.env.MARKETPLACE_WRITE_TOKEN;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_PUBLIC_BASE;
    delete process.env.MARKETPLACE_IMAGE_PREFIX;
    delete process.env.MARKETPLACE_IMAGE_MAX_BYTES;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("rejects write-protected upload URL requests without token", async () => {
    const { POST } = await loadRoute({
      writeToken: "secret",
      bucket: "constellation-tiles",
      endpoint: "https://example.r2.cloudflarestorage.com",
      accessKeyId: "abc",
      secretAccessKey: "def",
      publicBase: "https://pub.example.r2.dev"
    });

    const response = await POST(
      new Request("http://localhost/api/marketplace/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "listing.png",
          contentType: "image/png",
          size: 1200
        })
      })
    );

    expect(response.status).toBe(401);
  });

  it("validates content type and file size", async () => {
    const { POST } = await loadRoute({
      bucket: "constellation-tiles",
      endpoint: "https://example.r2.cloudflarestorage.com",
      accessKeyId: "abc",
      secretAccessKey: "def",
      publicBase: "https://pub.example.r2.dev",
      maxBytes: "64"
    });

    const response = await POST(
      new Request("http://localhost/api/marketplace/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "listing.gif",
          contentType: "image/gif",
          size: 72
        })
      })
    );

    const body = (await response.json()) as { errors?: string[] };

    expect(response.status).toBe(400);
    expect(body.errors?.some((error) => error.includes("contentType"))).toBe(true);
    expect(body.errors?.some((error) => error.includes("file size"))).toBe(true);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("returns signed upload URL and public URL when request is valid", async () => {
    getSignedUrlMock.mockResolvedValue("https://signed.example/upload");
    const { POST } = await loadRoute({
      writeToken: "secret",
      bucket: "constellation-tiles",
      endpoint: "https://c17e87fe5cecf116e4c0d7cfbfeacad6.r2.cloudflarestorage.com/constellation-tiles",
      accessKeyId: "abc",
      secretAccessKey: "def",
      publicBase: "https://pub-846275d6218e4ebdabad95b0dffe17a4.r2.dev",
      imagePrefix: "marketplace/images"
    });

    const response = await POST(
      new Request("http://localhost/api/marketplace/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-marketplace-write-token": "secret"
        },
        body: JSON.stringify({
          filename: "listing.png",
          contentType: "image/png",
          size: 1024
        })
      })
    );

    const body = (await response.json()) as {
      key?: string;
      uploadUrl?: string;
      publicUrl?: string;
      expiresInSeconds?: number;
    };
    const s3Config = s3ClientConfigMock.mock.calls[0]?.[0] as { endpoint?: string } | undefined;
    const putObjectInput = putObjectInputMock.mock.calls[0]?.[0] as
      | { Bucket?: string; Key?: string; ContentType?: string }
      | undefined;

    expect(response.status).toBe(200);
    expect(body.uploadUrl).toBe("https://signed.example/upload");
    expect(body.publicUrl).toContain("https://pub-846275d6218e4ebdabad95b0dffe17a4.r2.dev/marketplace/images/");
    expect(body.key).toContain("marketplace/images/");
    expect(body.expiresInSeconds).toBe(60);
    expect(s3Config?.endpoint).toBe(
      "https://c17e87fe5cecf116e4c0d7cfbfeacad6.r2.cloudflarestorage.com"
    );
    expect(putObjectInput?.Bucket).toBe("constellation-tiles");
    expect(putObjectInput?.Key).toBe(body.key);
    expect(putObjectInput?.ContentType).toBe("image/png");
    expect(getSignedUrlMock).toHaveBeenCalledOnce();
  });
});
