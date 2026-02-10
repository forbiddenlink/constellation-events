import { NextResponse } from "next/server";
import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceModerationStatus
} from "@/lib/marketplace";
import { MARKETPLACE_CATEGORIES, MARKETPLACE_CONDITIONS } from "@/lib/marketplace";
import {
  getMarketplaceWriteAuth,
  getMarketplaceWriteTokenHeaderName
} from "@/lib/marketplace-auth";
import { isAllowedMarketplaceImageUrl, isValidHttpUrl } from "@/lib/marketplace-images";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { updateMarketplaceListing } from "@/lib/marketplace-store";

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: Request, context: RouteContext) {
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

  const rateLimit = checkRateLimit(
    `marketplace:patch:${getClientIp(request)}`,
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

  const id = context.params.id;
  const payload = await request.json().catch(() => null);

  const patch: {
    title?: string;
    tag?: string;
    category?: MarketplaceCategory;
    condition?: MarketplaceCondition;
    city?: string;
    shipping?: boolean;
    priceUsd?: number;
    description?: string;
    imageUrl?: string;
    status?: MarketplaceModerationStatus;
  } = {};

  const errors: string[] = [];

  if (payload?.title !== undefined) {
    if (typeof payload.title !== "string" || payload.title.trim().length < 4) {
      errors.push("title must be at least 4 characters");
    } else {
      patch.title = payload.title.trim();
    }
  }

  if (payload?.tag !== undefined) {
    if (typeof payload.tag !== "string" || payload.tag.trim().length < 3) {
      errors.push("tag must be at least 3 characters");
    } else {
      patch.tag = payload.tag.trim();
    }
  }

  if (payload?.category !== undefined) {
    if (!isCategory(payload.category)) {
      errors.push("invalid category");
    } else {
      patch.category = payload.category;
    }
  }

  if (payload?.condition !== undefined) {
    if (!isCondition(payload.condition)) {
      errors.push("invalid condition");
    } else {
      patch.condition = payload.condition;
    }
  }

  if (payload?.city !== undefined) {
    if (typeof payload.city !== "string" || payload.city.trim().length === 0) {
      errors.push("city is required");
    } else {
      patch.city = payload.city.trim();
    }
  }

  if (payload?.shipping !== undefined) {
    patch.shipping = Boolean(payload.shipping);
  }

  if (payload?.priceUsd !== undefined) {
    const parsed =
      typeof payload.priceUsd === "number"
        ? payload.priceUsd
        : Number.parseFloat(String(payload.priceUsd));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      errors.push("priceUsd must be a positive number");
    } else {
      patch.priceUsd = parsed;
    }
  }

  if (payload?.description !== undefined) {
    if (typeof payload.description !== "string" || payload.description.trim().length > 320) {
      errors.push("description must be 320 characters or fewer");
    } else {
      patch.description = payload.description.trim();
    }
  }

  if (payload?.imageUrl !== undefined) {
    if (typeof payload.imageUrl !== "string") {
      errors.push("imageUrl must be a valid http/https URL");
    } else if (payload.imageUrl.trim() !== "" && !isValidHttpUrl(payload.imageUrl)) {
      errors.push("imageUrl must be a valid http/https URL");
    } else if (payload.imageUrl.trim() !== "" && !isAllowedMarketplaceImageUrl(payload.imageUrl.trim())) {
      errors.push("imageUrl must be from an allowed domain");
    } else {
      patch.imageUrl = payload.imageUrl.trim();
    }
  }

  if (payload?.status !== undefined) {
    if (!isModerationStatus(payload.status)) {
      errors.push("status must be approved, pending, or hidden");
    } else {
      patch.status = payload.status;
    }
  }

  if (Object.keys(patch).length === 0) {
    errors.push("no valid fields to update");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid payload", errors }, { status: 400 });
  }

  const updated = await updateMarketplaceListing(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({
    listing: updated,
    message: "Listing updated"
  });
}

function isCategory(value: unknown): value is MarketplaceCategory {
  return MARKETPLACE_CATEGORIES.some((item) => item.value === value);
}

function isCondition(value: unknown): value is MarketplaceCondition {
  return MARKETPLACE_CONDITIONS.some((item) => item.value === value);
}

function isModerationStatus(value: unknown): value is MarketplaceModerationStatus {
  return value === "approved" || value === "pending" || value === "hidden";
}
