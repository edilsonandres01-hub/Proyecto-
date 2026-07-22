import { NextResponse } from 'next/server';
import { getDataroomMetrics } from '@/lib/dataroomMetrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lead/investor data room KPIs — sandbox, no auth.
 */
export async function GET() {
  const metrics = await getDataroomMetrics();
  return NextResponse.json(metrics);
}
