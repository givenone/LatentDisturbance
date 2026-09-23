"""Prepare synchronized website copies of the real-world imagination pairs."""
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "more_results"
PUBLIC = ROOT / "public"
CACHE = ROOT / ".wrangler/real-imagination-cache.json"
cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}


def probe(path):
    stream = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=avg_frame_rate,nb_frames,width,height",
        "-of", "json", str(path),
    ]))["streams"][0]
    return float(Fraction(stream["avg_frame_rate"])), int(stream["nb_frames"])


examples, jobs = [], []
folders = sorted((p for p in SOURCE.iterdir() if p.is_dir()),
                 key=lambda p: (not p.name.isdigit(), int(p.name.split("_")[0])))
for folder in folders:
    sources = [folder / f"{name}.mp4" for name in ["nominal", "pessimistic"]]
    timings = [probe(path) for path in sources]
    fps = timings[0][0]
    assert all(rate == fps for rate, _ in timings), f"Frame rates differ: {folder}"
    frames = max(count for _, count in timings)
    examples.append({
        "id": folder.name, "fps": fps, "nSteps": frames,
        "nominal": f"/more_results/{folder.name}/nominal.mp4",
        "pessimistic": f"/more_results/{folder.name}/pessimistic.mp4",
        "holdsFinalFrame": any(count < frames for _, count in timings),
    })
    for source, (_, original_frames) in zip(sources, timings):
        target = PUBLIC / source.relative_to(ROOT)
        key = str(target.relative_to(PUBLIC))
        signature = [source.stat().st_mtime_ns, source.stat().st_size, frames, "v1"]
        if target.exists() and cache.get(key) == signature:
            continue
        jobs.append((source, target, key, signature, fps, frames, original_frames))


def encode(job):
    source, target, key, signature, fps, frames, original_frames = job
    target.parent.mkdir(parents=True, exist_ok=True)
    filters = ["scale=960:-2"]
    if original_frames < frames:
        filters.append(f"tpad=stop_mode=clone:stop={frames-original_frames}")
    gop = str(max(1, round(fps / 4)))
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(source), "-vf", ",".join(filters), "-frames:v", str(frames),
        "-c:v", "libx264", "-threads", "1", "-preset", "fast", "-crf", "23",
        "-g", gop, "-keyint_min", gop, "-sc_threshold", "0", "-bf", "0",
        "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", str(target),
    ], check=True)
    assert probe(target) == (fps, frames), target
    return key, signature


with ThreadPoolExecutor(max_workers=4) as pool:
    for key, signature in pool.map(encode, jobs):
        cache[key] = signature
CACHE.parent.mkdir(parents=True, exist_ok=True)
CACHE.write_text(json.dumps(cache))
(ROOT / "app/data/hardware-imaginations.json").write_text(json.dumps(examples, indent=2) + "\n")
print(f"Prepared {len(examples)} real-world pairs ({len(jobs)} videos encoded).")
