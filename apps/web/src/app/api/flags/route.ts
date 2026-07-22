import { NextResponse } from 'next/server';
import { resolveFeatureFlags } from '@pymebot/core';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ flags: resolveFeatureFlags() });
}
