// NOTE: This route is disabled for static export (output: 'export' in next.config.mjs).
// It requires a live Node.js server. Re-enable when running as a server-side app.
export const dynamic = 'force-static';

// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const filename = body?.filename || `upload_${Date.now()}.mp4`;

//     // Demo: return a test PUT endpoint (httpbin) as a stand-in for a real presigned URL.
//     // Replace this with your cloud storage presigned URL generation.
//     const uploadUrl = 'https://httpbin.org/put';

//     return NextResponse.json({ uploadUrl, filename });
//   } catch (e) {
//     return NextResponse.json({ error: 'invalid request' }, { status: 400 });
//   }
// }
