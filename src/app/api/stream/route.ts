export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { subscribe, unsubscribe } from '@/lib/broadcaster';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const screenId = url.searchParams.get('screenId');

  if (!screenId) {
    return NextResponse.json({ error: 'Missing screenId' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send a comment to establish the stream
      controller.enqueue(new TextEncoder().encode(`: connected\n\n`));

      const handler = (data: any) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          console.error('SSE handler encoding error', e);
        }
      };

      subscribe(`screen:${screenId}`, handler);
    },
    cancel(reason) {
      // Called when the consumer disconnects; clean up subscription
      try {
        unsubscribe(`screen:${screenId}`, () => {});
      } catch (e) {
        console.error('SSE unsubscribe error', e);
      }
    },
  });

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  return new Response(stream, { headers });
}
