import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, type, url, body: htmlBody, data, duration } = body || {};

    if (id) {
      // Update existing content
      const updated = await prisma.content.update({
        where: { id },
        data: {
          name,
          type,
          url: url || null,
          body: htmlBody || null,
          data: data || null,
          duration: duration || 10,
        },
      });
      return NextResponse.json({ success: true, content: updated });
    }

    // Create new content
    const created = await prisma.content.create({
      data: {
        name,
        type,
        url: url || null,
        body: htmlBody || null,
        data: data || null,
        duration: duration || 10,
      },
    });
    return NextResponse.json({ success: true, content: created });
  } catch (err) {
    console.error('complete-upload error', err);
    return NextResponse.json({ error: 'Failed to create or update content' }, { status: 500 });
  }
}
