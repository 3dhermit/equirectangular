# Quest Asset Caching & Fleet Deployment Notes

## Problem
Twenty to thirty Quest headsets simultaneously downloading a 136 MB anatomy dataset over classroom Wi-Fi would saturate a typical router. The fix is a one-time preload per headset, not per-session downloads.

## OPFS Caching (Origin Private File System)
OPFS is a real sandboxed filesystem per web origin, invisible to the OS file manager, persistent across sessions, with no permission prompts. It supports hundreds of MB to GB, native binary storage, and a synchronous API available inside Web Workers — making large sequential reads dramatically faster than IndexedDB.

| Storage | Capacity | Binary | Random Access | Write Speed (100 MB) |
| --- | --- | --- | --- | --- |
| localStorage | ~5 MB | No (base64) | No | N/A |
| IndexedDB | Hundreds of MB | Yes | No (cursors) | ~850 ms |
| Cache API | Hundreds of MB | Yes | No | Via fetch |
| **OPFS** | Hundreds of MB–GB | Yes | **Yes (`{ at: offset }`)** | **~90 ms (sync handle)** |

### Implementation Pattern
1. On first load, check OPFS for a manifest file containing the dataset version hash.
2. If missing or stale, stream-download the Draco-compressed GLB (or per-system chunks) into OPFS using a `FileSystemSyncAccessHandle` inside a Web Worker so the main thread (and WebXR render loop) never blocks.
3. On subsequent loads, read directly from OPFS — zero network traffic during class.
4. Version the manifest so a dataset update invalidates the cache cleanly.

### Size Reduction Before Caching
- Run OBJs through **meshoptimizer** (0.2% error target) — LearnAnatomy3D's approach.
- Convert to **Draco-compressed GLB** — can cut 136 MB to roughly 20–30 MB.
- Lazy-load by body system: cardiovascular first, skeletal later. Turns one giant download into several small ones spread across lessons.

### Browser Support on Quest
All modern engines on Quest support OPFS: Meta Quest Browser (Chromium), Wolvic Gecko, and Wolvic Chromium. No special flags needed.

## Alternative Browsers on Quest

### Wolvic (Igalia)
- Successor to Mozilla's discontinued Firefox Reality.
- Two engine builds: **Gecko** (v1.10, Oct 2026) and **Chromium** (v1.4, Oct 2026).
- Available on the Meta Quest store, or sideload APKs from https://wolvic.com/dl/ (Quest non-store versions require Developer Mode).
- Has file upload/download support, PWA detection, hand tracking, and OpenXR backend by default.
- **Caveat**: Igalia moved Wolvic to maintenance mode in Nov 2025 — security updates only, no new features.
- Sideload via ADB: `adb install Wolvic-oculusvr-arm64-world-gecko-generic-release.apk`

### R800ZZbrowser (community fork)
- Wolvic-based, supports both Gecko and Chromium engines.
- Adds local video file playback, OS-level file access permissions (requires granting in headset settings), chroma key compositing, and experimental WebXR AR in modified Gecko.
- Supports Quest 2/3/3S and Pico devices. Source: https://github.com/r800zz/r800zzbrowser
- Closest match to "handle local files and downloads better" for preloading datasets.

### Meta Quest Browser (built-in)
- Most complete WebXR support of any headset browser — full immersive-vr, immersive-ar (passthrough), hand tracking.
- No install needed. This is the default target for the equirectangular project.
- Limitation: no kiosk mode, and on Quest OS v55+ it won't enter VR mode when WebXR links are launched via ArborXR.

## ArborXR Fleet Deployment
ArborXR is a classroom/enterprise management platform that can:
1. Push a Wolvic APK to an entire fleet of managed headsets at once.
2. Hide Wolvic from the app library so students can't browse away.
3. Launch your HTTPS URL in a **kiosk-mode window** inside Wolvic — students can't navigate to other sites.
4. On Quest OS v55+, this is the only reliable way to force WebXR entry, since the native Quest browser blocks VR mode for ArborXR-launched links.

Workflow: upload Wolvic APK to ArborXR Content Library → install to devices → uncheck "show in library" under Managed Apps → create Web Launch shortcuts pointing at your equirectangular URL. All headsets open the same page, same kiosk, zero student fiddling.

## Recommended Classroom Pipeline
1. **Before class**: students (or IT) run the page once on school Wi-Fi during a low-traffic window. OPFS caches the Draco GLB (~20–30 MB) per headset.
2. **During class**: page detects cached manifest, loads from OPFS instantly, fully offline. No Wi-Fi strain.
3. **Fleet scale**: ArborXR handles Wolvic install + kiosk launch across 20–30 headsets uniformly.
4. **Updates**: bump the dataset version hash in the manifest; stale caches auto-refresh on next online check.

## Open Questions / Follow-ups
- Test OPFS write throughput on Quest 3 vs Quest 2 (storage medium differs).
- Verify Wolvic Gecko's OPFS sync-handle support in a Worker — Gecko has historically lagged Chromium on some File System Access APIs.
- Consider a Service Worker as a fallback cache layer for the HTML/JS shell itself, separate from OPFS for the binary assets.
