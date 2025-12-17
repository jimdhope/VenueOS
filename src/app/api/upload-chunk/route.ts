import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
}

export async function POST(req: Request) {
  try {
    const uploadId = req.headers.get('x-upload-id');
    const chunkIndexRaw = req.headers.get('x-chunk-index');
    const chunkTotalRaw = req.headers.get('x-chunk-total');
    const filenameHeader = req.headers.get('x-filename') || '';

    if (!uploadId || !chunkIndexRaw || !chunkTotalRaw) {
      return NextResponse.json({ error: 'Missing upload headers' }, { status: 400 });
    }

    const chunkIndex = Number(chunkIndexRaw);
    const chunkTotal = Number(chunkTotalRaw);
    const safeName = safeFileName(filenameHeader || `${uploadId}`);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempPath = path.join(uploadsDir, `${uploadId}.part`);

    // Read chunk body as ArrayBuffer then append to temp file
    const buf = Buffer.from(await req.arrayBuffer());
    await fs.promises.appendFile(tempPath, buf);

    if (chunkIndex === chunkTotal - 1) {
      // Final chunk — move to final filename
      const finalPath = path.join(uploadsDir, safeName);
      // If a file with the final name already exists, append a timestamp
      let destPath = finalPath;
      if (fs.existsSync(destPath)) {
        const name = `${Date.now()}-${safeName}`;
        destPath = path.join(uploadsDir, name);
      }
      await fs.promises.rename(tempPath, destPath);
      const publicUrl = `/uploads/${path.basename(destPath)}`;
      return NextResponse.json({ success: true, finished: true, publicUrl });
    }

    return NextResponse.json({ success: true, finished: false });
  } catch (err) {
    console.error('upload-chunk error', err);
    return NextResponse.json({ error: 'Failed to append chunk' }, { status: 500 });
  }
}
