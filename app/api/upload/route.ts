import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PUT(req: Request) {
  const allowedOrigin = process.env.EDITOR_ALLOWED_ORIGIN || '*';
  try {
    const url = new URL(req.url);
    const filename = url.searchParams.get('filename') || `upload_${Date.now()}.mp4`;

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `${(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/uploads/${encodeURIComponent(filename)}`;

    return NextResponse.json({ success: true, url: publicUrl }, { headers: { 'Access-Control-Allow-Origin': allowedOrigin } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500, headers: { 'Access-Control-Allow-Origin': allowedOrigin } });
  }
}
