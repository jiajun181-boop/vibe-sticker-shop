export async function register() {
  return;
}

export async function onRequestError(
  _error: { digest: string } & Error,
  _request: { path: string; method: string; headers: Record<string, string> },
  _context: { routerKind: string; routePath: string; routeType: string; renderSource: string },
) {
  return;
}
