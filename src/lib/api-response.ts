import { NextResponse } from "next/server";

/**
 * Standardized API Error Response
 *
 * All API routes should use this format for consistency:
 * - error: Human-readable error message
 * - code: Machine-readable error code (optional)
 * - details: Additional context like validation errors (optional)
 */
export type ApiErrorResponse = {
  error: string;
  code?: string;
  details?: string[];
};

type ErrorResponseOptions = {
  status?: number;
  code?: string;
  details?: string[];
};

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  options: ErrorResponseOptions = {}
): NextResponse<ApiErrorResponse> {
  const { status = 500, code, details } = options;

  const body: ApiErrorResponse = { error: message };
  if (code) body.code = code;
  if (details && details.length > 0) body.details = details;

  return NextResponse.json(body, { status });
}

/**
 * Common error responses
 */
export const errors = {
  badRequest: (message = "Bad request", details?: string[]) =>
    errorResponse(message, { status: 400, code: "BAD_REQUEST", details }),

  unauthorized: (message = "Unauthorized") =>
    errorResponse(message, { status: 401, code: "UNAUTHORIZED" }),

  forbidden: (message = "Forbidden") =>
    errorResponse(message, { status: 403, code: "FORBIDDEN" }),

  notFound: (message = "Not found") =>
    errorResponse(message, { status: 404, code: "NOT_FOUND" }),

  rateLimited: (retryAfter: number) =>
    errorResponse("Too many requests", {
      status: 429,
      code: "RATE_LIMITED",
      details: [`Retry after ${retryAfter} seconds`]
    }),

  invalidOrigin: () =>
    errorResponse("Invalid origin", { status: 403, code: "INVALID_ORIGIN" }),

  serverError: (message = "Internal server error") =>
    errorResponse(message, { status: 500, code: "SERVER_ERROR" })
};
