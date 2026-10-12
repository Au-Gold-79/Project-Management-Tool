"""Create a sanitized Windows archive; also reusable for GitHub source staging."""
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {'node_modules', '.git', '.turbo', '.cache', '__pycache__', '.expo', 'data', 'demo-data', 'test-data', 'uploads', 'dist-electron', 'release'}

def release_files(include_build=True):
    import os
    for base, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and (d != 'dist' or (include_build and Path(base) == ROOT / 'packages/web'))]
        for name in names:
            path = Path(base) / name
            rel = path.relative_to(ROOT)
            if name.startswith('.env') or name == 'task.md' or name.endswith(('.sqlite', '.sqlite-wal', '.sqlite-shm', '.db', '.db-wal', '.db-shm', '.log', '.zip', '.tsbuildinfo')):
                continue
            if '.runable' in rel.parts and str(rel) != '.runable/ports.json':
                continue
            if path.is_symlink():
                continue
            yield path, rel

if __name__ == '__main__':
    output = ROOT.parent / 'project-management-windows.zip'
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path, rel in release_files():
            archive.write(path, Path('Project-Management-Tool') / rel)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        print(f'Created {output}: {len(archive.namelist())} files, {output.stat().st_size:,} bytes')