"""Create seek-friendly website copies; keep research media unchanged."""
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
CACHE = ROOT / '.wrangler/playback-media-cache.json'
cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
jobs = []

def info(path):
    data = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=avg_frame_rate,nb_frames,width,height,duration', '-of', 'json', str(path)]))['streams'][0]
    a, b = map(int, data['avg_frame_rate'].split('/'))
    return {**data, 'fps': a / b}

def queue(source, target, *, start=0, frames=None, size=None):
    source, target = ROOT / source, PUBLIC / target
    signature = [source.stat().st_mtime_ns, source.stat().st_size, start, frames, size, 'short-gop-v1']
    key = str(target.relative_to(PUBLIC))
    if target.exists() and cache.get(key) == signature:
        return
    jobs.append((source, target, signature, key, start, frames, size))

for folder in sorted((ROOT / 'front_figure').glob('[1-7]_*')):
    queue(folder.relative_to(ROOT) / 'original_cropped.mp4', folder.relative_to(ROOT) / 'current.mp4', start=6, size=640)
    for name in ['nominal', 'ood', 'pessimistic']:
        path = folder.relative_to(ROOT) / f'{name}.mp4'
        queue(path, path, size=640)

for condition in ['robust', 'nominal']:
    base = Path('filtering_results') / condition
    manifest = json.loads((ROOT / base / 'index.json').read_text())
    for entry in manifest['trajectories']:
        for video in entry['video'].values():
            queue(base / video, base / video)

base = Path('sim_results/final_qualitative_results')
for entry in json.loads((ROOT / base / 'index.json').read_text())['trajectories']:
    for mode in ['nominal', 'robust']:
        for view in ['front', 'wrist']:
            path = base / f"{entry['tag']}_{mode}_{view}.mp4"
            queue(path, path)

base = Path('sim_results/processed')
queue(base / 'video_grid_stochasticity.mp4', base / 'task_intro.mp4', frames=110, size=640)
for left, right in [('ood/real_1.mp4', 'ood/ood_1.mp4'), ('imagination/nominal_1.mp4', 'imagination/pessimistic_1.mp4'), ('imagination/nominal_2.mp4', 'imagination/pessimistic_2.mp4')]:
    count = min(int(info(ROOT / base / p)['nb_frames']) for p in [left, right])
    for path in [left, right]:
        queue(base / path, base / path, frames=count, size=480)

def encode(job):
    source, target, signature, key, start, frames, size = job
    fps = info(source)['fps']
    target.parent.mkdir(parents=True, exist_ok=True)
    command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y']
    if start:
        command += ['-ss', str(start)]
    command += ['-i', str(source)]
    if size:
        command += ['-vf', f'scale={size}:{size}:force_original_aspect_ratio=decrease:force_divisible_by=2']
    if frames:
        command += ['-frames:v', str(frames)]
    gop = str(max(1, round(fps / 4)))
    command += ['-c:v', 'libx264', '-threads', '1', '-preset', 'fast', '-crf', '25', '-g', gop, '-keyint_min', gop, '-sc_threshold', '0', '-bf', '0', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', str(target)]
    subprocess.run(command, check=True)
    return key, signature

with ThreadPoolExecutor(max_workers=4) as pool:
    for key, signature in pool.map(encode, jobs):
        cache[key] = signature
CACHE.parent.mkdir(parents=True, exist_ok=True)
CACHE.write_text(json.dumps(cache))
print(f'Prepared {len(jobs)} seek-friendly video files, with trimmed current-state and intro clips.')
