import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const allowedOrigin = process.env.EDITOR_ALLOWED_ORIGIN || '*';

		// If caller provides a direct `url`, return it as-is.
		if (body?.url) {
			return NextResponse.json({ downloadUrl: body.url }, { headers: { 'Access-Control-Allow-Origin': allowedOrigin } });
		}

// If an assetId (project id) was provided, return a local proxy URL so the editor can fetch through the app.
  if (body?.assetId) {
    try {
      const projectId = String(body.assetId);
      const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const proxyUrl = `${appUrl}/api/video-proxy?projectId=${encodeURIComponent(projectId)}`;
      return NextResponse.json({ downloadUrl: proxyUrl, assetId: projectId }, { headers: { 'Access-Control-Allow-Origin': allowedOrigin } });
    } catch (err) {
      // fallback to demo if anything goes wrong
    }
			const demo = 'https://archive.org/download/BigBuckBunny_320x180/BigBuckBunny_320x180.mp4';
			return NextResponse.json({ downloadUrl: demo, assetId: body.assetId }, { headers: { 'Access-Control-Allow-Origin': allowedOrigin } });
		}

		return NextResponse.json({ error: 'missing url or assetId' }, { status: 400 });
	} catch (e) {
		return NextResponse.json({ error: 'invalid request' }, { status: 400 });
	}
}
