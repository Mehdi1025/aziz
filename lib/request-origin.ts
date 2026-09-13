export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto =
      forwardedProto?.split(",")[0]?.trim() ??
      (host?.includes("localhost") ? "http" : "https");
    if (host) {
      return `${proto}://${host}`;
    }
  }

  const host = request.headers.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
