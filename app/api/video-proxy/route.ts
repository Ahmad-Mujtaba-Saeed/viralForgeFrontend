import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const allowedOrigin = process.env.EDITOR_ALLOWED_ORIGIN || '*';
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const sourceUrl = url.searchParams.get('url');

    if (!projectId && !sourceUrl) {
      return new NextResponse(JSON.stringify({ error: 'missing projectId or url' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
        },
      });
    }

    let fetchUrl = sourceUrl;
    if (projectId) {
      const projectsDir = path.resolve(process.cwd(), 'data', 'projects');
      const filePath = path.join(projectsDir, `${projectId}.json`);
      if (!fs.existsSync(filePath)) {
        return new NextResponse(JSON.stringify({ error: 'project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin,
          },
        });
      }
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const project = JSON.parse(raw);
      fetchUrl = project?.video_path || project?.output_path || project?.videoUrl;
      if (!fetchUrl) {
        return new NextResponse(JSON.stringify({ error: 'no video path found' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin,
          },
        });
      }
    }

    const upstream = await fetch(fetchUrl as string);
    if (!upstream.ok) {
      return new NextResponse(JSON.stringify({ error: `upstream fetch failed: ${upstream.status}` }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
        },
      });
    }

    const headers = new Headers(upstream.headers);
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
      },
    });
  }
}
