# AI Explainer demo video

The landing page reserves a full 16:9 slot for a demo of the flagship
AI Explainer template. Until a file is dropped here it renders a labelled
"Demo video coming soon" placeholder — the frame and surrounding copy are the
finished design either way.

## To publish the demo

1. Put the files here:
   - `ai-explainer-demo.mp4`      — H.264 / AAC, 1920x1080, ideally under ~20 MB
   - `ai-explainer-poster.jpg`    — 1920x1080 still, shown before playback

2. Open `components/landing/shared/content.ts` and edit `DEMO_VIDEO`:

   ```ts
   export const DEMO_VIDEO: DemoVideo = {
     enabled: true,                  // <- flip this on
     src: "/demo/ai-explainer-demo.mp4",
     poster: "/demo/ai-explainer-poster.jpg",
     title: "...",
     description: "...",
     duration: "PT1M12S",            // ISO 8601, e.g. 1 min 12 s
     uploadDate: "2026-08-28",       // ISO date
   }
   ```

3. Rebuild (`pnpm build`).

`duration` and `uploadDate` are not cosmetic: the home page only emits the
VideoObject structured data once `enabled` is true AND `uploadDate` is set,
because schema describing a video that does not exist is a rich-results error
rather than a bonus. With both filled in, the demo becomes eligible for a video
rich result in search.

Hosting the file elsewhere (R2, a CDN) works too — put the absolute URL in
`src` and keep `poster` as a local path.
