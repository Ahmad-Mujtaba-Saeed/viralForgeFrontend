# Recorded style previews

The loops the storyboard's style pickers play on hover. **Generated, not
hand-made — do not edit these files.**

Each one is the real `Explainer` composition rendering the same three-beat demo
storyboard, with exactly one setting changed. That is the point: what a user
hovers is what the renderer actually does, not a CSS impression of it.

## Re-recording

Whenever a motion preset, skin, board style, font pack or the composition
machinery changes, the clips are stale — re-record them:

```bash
cd remotion-render
npx tsx scripts/style-previews.ts ../b_f7Z3xSZkLVx/public/style-previews
# …or just the group you touched:
npx tsx scripts/style-previews.ts ../b_f7Z3xSZkLVx/public/style-previews motion
```

About 10-15 seconds per clip, 17 clips, ~10MB total. Groups: `motion`, `skin`,
`composition`, `board`, `font`.

## What ships

    <group>/<key>.gif    the loop, 480x270 at 15fps, looping forever
    <group>/<key>.png    the first settled frame, painted instantly under it
    manifest.json        what exists

Nothing here is fetched on page load: `StylePicker` only requests a clip once a
pointer actually rests on that option, paints the poster first, and fades the
GIF in when it has decoded. A missing file degrades to "No preview recorded for
this option yet" rather than a broken image, so adding a new style before
re-recording is safe.

Anyone who has asked their system for reduced motion sees the poster only, and
is told so.
