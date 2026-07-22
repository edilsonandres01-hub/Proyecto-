import type { NextRequest } from 'next/server';

const DEMO_API_KEY = 'pymebot_demo_key';

/**
 * Validates the X-Api-Key header against the demo key or PYMEBOT_API_KEY.
 * Returns a 401 Response when unauthorized; otherwise null.
 */
export function requireApiKey(req: NextRequest): Response | null {
  const apiKey = req.headers.get('X-Api-Key') ?? req.headers.get('x-api-key');
  const envKey = process.env.PYMEBOT_API_KEY;

  if (apiKey !== DEMO_API_KEY && apiKey !== envKey) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
