"""Prepare local website assets without changing experiment exports."""
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'

def copy(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or source.stat().st_mtime > target.stat().st_mtime:
        shutil.copy2(source, target)

def probe(path):
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_streams', '-of', 'json', str(path)]))['streams'][0]
    a, b = map(int, info['r_frame_rate'].split('/'))
    return a / b, int(info['nb_frames'])

for source in (ROOT / 'front_figure').rglob('*'):
    if source.suffix in ['.png', '.svg', '.mp4']:
        copy(source, PUBLIC / source.relative_to(ROOT))

for condition in ['robust', 'nominal']:
    base = ROOT / 'filtering_results' / condition
    manifest = json.loads((base / 'index.json').read_text())
    clean = {**manifest, 'trajectories': []}
    for entry in manifest['trajectories']:
        data = json.loads((base / entry['data']).read_text())
        assert len(data['signals']['reachability']) == entry['n_steps']
        for path in entry['video'].values():
            fps, frames = probe(base / path)
            assert fps == data['fps'] and frames == entry['n_steps'], path
            copy(base / path, PUBLIC / 'filtering_results' / condition / path)
        copy(base / entry['data'], PUBLIC / 'filtering_results' / condition / entry['data'])
        clean['trajectories'].append({k: v for k, v in entry.items() if k != 'debug'})
    (PUBLIC / 'filtering_results' / condition / 'index.json').write_text(json.dumps(clean))

base = ROOT / 'sim_results/final_qualitative_results'
manifest = json.loads((base / 'index.json').read_text())
target = PUBLIC / 'sim_results/final_qualitative_results'
target.mkdir(parents=True, exist_ok=True)
for entry in manifest['trajectories']:
    data = json.loads((base / entry['graphs_json']).read_text())
    for condition in ['nominal', 'robust']:
        assert len(data[condition]['reachability']) == entry['n_steps']
        assert len(data[condition]['is_filtered']) == entry['n_steps']
        for view in ['front', 'wrist']:
            path = f"{entry['tag']}_{condition}_{view}.mp4"
            fps, frames = probe(base / path)
            assert frames == entry['n_steps'] and fps == 10, path
            copy(base / path, target / path)
    copy(base / entry['graphs_json'], target / entry['graphs_json'])
    entry['fps'] = 10
    entry['media'] = [p for p in entry['media'] if p.endswith(('_front.mp4', '_wrist.mp4'))]
(target / 'index.json').write_text(json.dumps(manifest))

for source in (ROOT / 'sim_results/processed').rglob('*.mp4'):
    target = PUBLIC / source.relative_to(ROOT)
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.name == 'video_grid_stochasticity.mp4':
        copy(source, target)
    elif not target.exists() or source.stat().st_mtime > target.stat().st_mtime:
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), '-vf', 'scale=480:-2', '-c:v', 'libx264', '-crf', '26', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', str(target)], check=True)
print('Prepared 7 actions, 44 hardware trajectories, 38 simulation pairs; all frame counts verified.')
subprocess.run(['python3', str(ROOT / 'scripts/prepare-playback.py')], check=True)
