export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getTimecodeStatus } from '@/app/actions/timecodes';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const timecodeId = url.searchParams.get('timecodeId');

  if (!timecodeId) {
    return NextResponse.json({ error: 'Missing timecodeId' }, { status: 400 });
  }

  try {
    const status = await getTimecodeStatus(timecodeId);
    if (!status) {
      return NextResponse.json({ error: 'Timecode not found' }, { status: 404 });
    }
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching timecode status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
