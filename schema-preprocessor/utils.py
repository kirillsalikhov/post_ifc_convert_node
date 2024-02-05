import json
from pathlib import Path

def write_json(data, out_path):
    # parent is for getting folder
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)