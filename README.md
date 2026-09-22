# Paper homepage

Local Sites/vinext page using React, TypeScript, and Chart.js. No deployment or backend service.

## Run

```sh
npm install
npm run prepare-media
npm run dev
```

Use the Local URL printed by the server. Media preparation requires Python 3 and FFmpeg/FFprobe. Original experiment exports remain unchanged.

## Content

- `app/data/content.ts`: title, authors, seven action paths copied exactly from the supplied SVGs, latent geometry, semantic colors, method captions, and media paths.
- `app/components/Formulation.tsx`: annotated formulations from manuscript equations (1) and (5).
- `app/components/Experiments.tsx`: real-world and simulation section order.
- `app/components/latentDrawing.ts`: schematic distributions, uncertainty sets, and image leaders.

The opening demo uses `front_figure/initial.png` with seven trajectories in the original 494 × 332 coordinates, shifted upward by 7 pixels. Selecting a trajectory preserves the selected imagination. The current-state player uses a generated `current.mp4` with the first six seconds removed, so its slider starts at zero. Both main players have matching dimensions, no printed timestamps, and loop after play. Only the selected latent distribution appears. Imagined outcomes map to `nominal.mp4`, `ood.mp4`, and `pessimistic.mp4`; the selected outcome also colors the player border.

## Media and playback

`scripts/prepare-media.py` copies viewer assets into `public/`, validates video frame counts against each trajectory, and runs `scripts/prepare-playback.py`. That second script makes H.264 copies with frequent keyframes for responsive seeking, trims the current-state clips, limits the simulation intro to 11 seconds, and resizes the six portrait comparison clips to 270 × 480. Paired clips have matching frame counts and share a controller. Original research files stay unchanged. Hardware debug videos and simulation montages with embedded plots are excluded.

Hardware viewers read the supplied robust/nominal manifests and per-trajectory JSON on demand. Both cameras use 20 fps, one frame per recorded step. Nominal runs include the aligned `robust_reachability` reference; filtering colors always follow recorded `is_filtered`, independently of the value sign.

Simulation comparisons use the 38 selected pairs in the supplied manifest. Both camera views for both methods use 10 fps and matching graph lengths. A shared timeline seeks every video to the same frame. The primary video drives a continuous cursor on a separate canvas overlay; the static Chart.js plot and data tables are not redrawn on playback ticks. Small companion drift is corrected through playback speed instead of repeated seeks. Dragging either plot or the slider pauses once, seeks all views, then restores the previous play state. Speed controls apply to the whole group. Buffering pauses the group; switching trajectories cancels pending playback and fetches. Restart returns to the first frame, paused.

Missing or failed media disable playback and show a status. Main-figure players start paused; experiment viewers automatically play and loop when visible, pausing offscreen to save decoding work. Previous/next arrows and shuffle replace trajectory dropdowns. The 11-second task intro autoplays and loops without a playbar. Reduced-motion preferences disable diagram animations. Formulations use background-highlighted KaTeX with local styles/fonts and accessible MathML.

## Quantitative provenance

`app/data/hardware.json` is copied verbatim from `../egg/0814_hardware_results/figures/results.json`. Surface failure rates mirror the success counts and Wilson 95% interval bounds. Robust rates use `all_safe` independently.

`app/data/simulation.ts` transcribes all active block-pouring tables in `../69532e950f3a5c79f81bcd92/experiment_mainpulation.tex`. Success and failure are independent rates because timeouts exist. Diagnostic charts preserve the reported means and ± spreads; those spreads are not confidence intervals. All charts retain accessible tables and focusable exact values.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

Tests verify all 21 demo mappings, source SVG paths, action/outcome persistence, method steps, shared four-video seeking, graph/border alignment, animation cleanup, hardware Wilson intervals, and every active simulation table value. Component tests use a simulated DOM and mocked playback; media preparation independently checks the real files with FFprobe. Browser playback/visual review is separate.
