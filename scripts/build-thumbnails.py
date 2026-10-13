"""Build lightweight portfolio previews without changing the original artwork."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1] / 'Nirvana_Studio' / 'assets'
count = total = originals = 0
for source in sorted(root.rglob('*')):
    if source.suffix.lower() not in {'.jpg', '.jpeg', '.png'} or 'thumbs' in source.parts or 'video' in source.parts:
        continue
    target = root / 'thumbs' / source.relative_to(root).with_suffix('.webp')
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((960, 960), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=80, method=6)
    count += 1
    total += target.stat().st_size
    originals += source.stat().st_size
print(f'{count} previews: {total / 1024 / 1024:.2f} MiB (originals: {originals / 1024 / 1024:.2f} MiB)')
