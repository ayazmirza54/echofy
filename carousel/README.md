# CLONE MODE — EP 01 carousel

Eight 1080×1350 (4:5) Instagram slides that go with the reel, in two styles:

- **Lime pop** (cover + result): acid-lime background, Instrument Serif mixed with Pixelify Sans pixel type and an italic serif accent word, and white-outlined stickers (mic, dictation pill, characters).
- **Graph-paper notebook** (steps 1–6): cream grid paper, a `(MONO LABEL)`, progress dots, a brush-script "Step N", a DM Serif Display headline, an olive stamp badge, a black icon tile with body copy, the handle, and an orange swipe arrow.

```
NODE_PATH=$(npm root -g) node render.cjs      # -> slides/clone_mode_ep01_01..08.png
```

Edit `carousel.html` (one `<section class="slide">` per slide) and re-render. Fonts are vendored in `fonts/` (all SIL OFL, from Google Fonts).
