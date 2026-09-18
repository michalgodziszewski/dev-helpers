# Idea: Tab Extractor — YouTube guitar-tab video → PDF

**Status:** seed / brainstormed (2026-07-18), not started. Captured so the next session starts
here instead of from scratch. No stack chosen, no branch, no `/feature plan` yet.

## What

An application that takes a **YouTube link to a guitar play-along video** where a scrolling
tablature is shown on screen, automatically **finds the tab, follows the scroll, stitches it into
one continuous image, and exports it as a clean PDF** for reading/printing.

Example video that started the idea:
`https://www.youtube.com/watch?v=wY6NzpdHQlA` — *"Naruto Shippuden – Despair (OST) Fingerstyle
Acoustic Guitar Tab"*.

## Decisions reached while brainstorming

These are the choices that shape the whole approach — settled during the discussion, not open:

1. **Image PDF, not editable tab.** The goal is a readable/printable PDF *image* of the tab. We
   deliberately do **not** try to reconstruct editable/playable notation (Guitar Pro / MusicXML).
   This is the single decision that makes the project tractable — it removes all OMR/OCR
   ("understand the notes") difficulty. We only need to *photograph* the tab, not read it.
2. **Fully automatic.** The app detects the tab region itself and follows the scroll itself — no
   manual "drag a box" step required from the user. (A cheap confirm/override safety net is
   recommended, see below, but the default path is automatic.)
3. **Both scroll directions.** Some videos scroll the tab **horizontally** (notes flow sideways
   past a fixed cursor — the example link does this); others scroll **vertically** (a block of
   staff lines jumps upward line by line). The app must **auto-detect** which one it is.
4. **Target genre: rendered tab videos.** The sweet spot is Guitar-Pro/TuxGuitar-style *rendered*
   playbacks (clean vector-like graphics, stable layout) rather than a camera filming hands or a
   paper sheet. These are the common "fingerstyle tab" videos and are by far the easiest input.

## Why it's feasible — the tab's visual signature

The whole thing hinges on one fact: a guitar tab is **6 evenly-spaced parallel horizontal lines**
(the strings) with numbers on them. Nothing else on screen looks like that (a music staff has 5
lines — also distinguishable). So detection never needs to "understand" the image, only to find
**that pattern**. This is what turns "fully automatic" from a wish into something realistic here.

## Proposed architecture (end to end)

```
1. yt-dlp (highest quality)   →  sharp digits matter most
2. ffmpeg → frames            →  ~2-4 fps
3. DETECT TAB REGION          →  row-wise projection profile; look for a
                                 group of ~6 regular, evenly-spaced peaks
4. DETECT SCROLL DIRECTION    →  phase correlation on 2 consecutive frames
                                 → horizontal / vertical / static
5. MEASURE PER-FRAME SHIFT    →  phase correlation again; accumulate offset
                                 (handles variable speed, pauses, ritardando)
6. STITCH VIA MEDIAN          →  build the long strip; per output pixel take
                                 the median across overlapping frames
7. SLICE INTO ROWS + PDF      →  cut the long strip to page width, stack, export
```

Steps 3-6 work **identically** for horizontal and vertical scroll — only the axis differs, so one
code path covers both.

### Two tricks that carry the design

- **Phase correlation** gives the global sub-pixel shift `(dx, dy)` between two frames. Its
  dominant axis tells you the scroll direction (step 4), and its magnitude gives the per-frame
  shift for stitching (step 5). Because it is measured per frame, variable scroll speed is free.
- **Temporal median stitching** solves three problems at once. Frames overlap heavily, so every
  output pixel is seen in many frames. Taking the **median**: (a) rejects the moving cursor /
  highlight bar as an outlier (it is only over a given spot in a few frames), (b) lets the static
  tab show through, (c) merges duplicated pixels during pauses → dedup for free.

## Hard parts / honest risks

- **Robustness across video variety** is where auto-detection breaks: different renderers, colors,
  line thickness, watermarks, picture-in-picture of the player's hands, busy backgrounds. Expect
  region + direction detection to work on ~80% of videos and to need extra rules for the rest.
- **Recommended safety net:** after auto-detection, show one frame — *"found the tab here, scroll =
  horizontal, OK?"* — with a manual override. Keeps the automatic default but turns silent
  failures into a one-click fix on the hard 20%.
- Camera-filmed tabs (not rendered) — noise, skew, shadows, shake — are much harder and out of
  scope for the first version.

## MVP → expansion path

1. **MVP:** one direction working end to end (start with horizontal, per the example link), fully
   automatic region + shift detection, median stitch, PDF out.
2. Add the **other scroll direction** (mostly the same code, other axis).
3. Add the **confirm/override** safety net for the hard cases.
4. Only later, if ever: editable output (OMR → MusicXML/Guitar Pro), camera-filmed inputs.

## Likely stack (not committed)

Python + OpenCV (region detection, phase correlation, median blending) + yt-dlp (download) +
ffmpeg (frames) + img2pdf / reportlab (PDF). To be confirmed at `/feature plan` time — could also
start from an existing template if a UI is wanted later.

## Next step

When picked up: run `/feature plan` for a new project under `projects/`, using this file as the
starting spec. Related: this would be the second real application after [[project-pensieve]].
