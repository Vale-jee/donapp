import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest): NextResponse {
  const requestId = randomUUID();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-donapp-request-id", requestId);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("X-Request-ID", requestId);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
