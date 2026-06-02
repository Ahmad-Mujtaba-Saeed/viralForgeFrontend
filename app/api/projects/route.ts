import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id || `proj_${Date.now()}`;
    const projectsDir = path.resolve(process.cwd(), 'data', 'projects');
    await fs.promises.mkdir(projectsDir, { recursive: true });
    const filePath = path.join(projectsDir, `${id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');

    return NextResponse.json({ success: true, id, path: `/data/projects/${id}.json` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
