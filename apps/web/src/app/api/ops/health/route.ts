import { NextResponse } from 'next/server';
import { getOpsHealth } from '@/lib/opsHealth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lead Ops health — JSON twin of `/ops`.
 * No auth for sandbox demo; never ship open in production.
 */
export async function GET() {
  const payload = await getOpsHealth();
  return NextResponse.json(payload);
}
