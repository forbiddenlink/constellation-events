import { NextResponse } from "next/server";
import type {
  MarketplaceCategory,
  MarketplaceCondition
} from "@/lib/marketplace";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  getMarketplaceListings,
  parseMarketplaceFilters
} from "@/lib/marketplace";
import {
  getMarketplaceWriteAuth,
  getMarketplaceWriteTokenHeaderName,
  isMarketplaceWriteProtected,
  validateOrigin
} from "@/lib/marketplace-auth";
import { isAllowedMarketplaceImageUrl, isValidHttpUrl } from "@/lib/marketplace-images";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  createMarketplaceListing,
  listMarketplaceListings
} from "@/lib/marketplace-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedFilters = parseMarketplaceFilters(searchParams);
  const writeAuth = getMarketplaceWriteAuth(request);
  const filters = {
    ...parsedFilters,
    visibility:
      parsedFilters.visibility === "all" && writeAuth.allowed && writeAuth.writeProtected
        ? "all"
        : "public"
  } as const;
  const source = await listMarketplaceListings();
  const listings = getMarketplaceListings(filters, source);

  return NextResponse.json({
    listings,
    count: listings.length,
    filters,
    auth: {
      writeProtected: isMarketplaceWriteProtected(),
      tokenHeader: getMarketplaceWriteTokenHeaderName()
    },
    generatedAt: new Date().toISOString()
  });
}

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

  const rateLimit = checkRateLimit(
    `marketplace:post:${getClientIp(request)}`,
    {
      limit: Number.parseInt(process.env.MARKETPLACE_WRITE_RATE_LIMIT_MAX || "10", 10),
      windowMs: Number.parseInt(process.env.MARKETPLACE_WRITE_RATE_LIMIT_WINDOW_MS || "60000", 10)
    }
  );
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

  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const tag = typeof payload?.tag === "string" ? payload.tag.trim() : "";
  const category = payload?.category as MarketplaceCategory | undefined;
  const condition = payload?.condition as MarketplaceCondition | undefined;
  const city = typeof payload?.city === "string" ? payload.city.trim() : "";
  const description =
    typeof payload?.description === "string" ? payload.description.trim() : undefined;
  const imageUrl = typeof payload?.imageUrl === "string" ? payload.imageUrl.trim() : undefined;
  const shipping = Boolean(payload?.shipping);
  const priceUsd =
    typeof payload?.priceUsd === "number"
      ? payload.priceUsd
      : Number.parseFloat(String(payload?.priceUsd ?? ""));

  const errors: string[] = [];
  if (title.length < 4) errors.push("title must be at least 4 characters");
  if (tag.length < 3) errors.push("tag must be at least 3 characters");
  if (!isCategory(category)) errors.push("invalid category");
  if (!isCondition(condition)) errors.push("invalid condition");
  if (!city) errors.push("city is required");
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) errors.push("priceUsd must be a positive number");
  if (description && description.length > 320) errors.push("description is too long (max 320)");
  if (imageUrl && !isValidHttpUrl(imageUrl)) errors.push("imageUrl must be a valid http/https URL");
  if (imageUrl && isValidHttpUrl(imageUrl) && !isAllowedMarketplaceImageUrl(imageUrl)) {
    errors.push("imageUrl must be from an allowed domain");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid payload", errors }, { status: 400 });
  }

  const validatedCategory = category as MarketplaceCategory;
  const validatedCondition = condition as MarketplaceCondition;

  const listing = await createMarketplaceListing({
    title,
    tag,
    category: validatedCategory,
    condition: validatedCondition,
    city,
    shipping,
    priceUsd,
    status: auth.writeProtected ? "pending" : "approved",
    description,
    imageUrl
  });

  return NextResponse.json(
    {
      listing,
      message: "Listing created"
    },
    { status: 201 }
  );
}

function isCategory(value: unknown): value is MarketplaceCategory {
  return MARKETPLACE_CATEGORIES.some((item) => item.value === value);
}

function isCondition(value: unknown): value is MarketplaceCondition {
  return MARKETPLACE_CONDITIONS.some((item) => item.value === value);
}
