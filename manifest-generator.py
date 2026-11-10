import hashlib
import json
import os

files_dict = dict()

PASS_DIR = "rewards.pass"
SKIP = {"manifest.json", "signature"}
files_dict = {}

for filename in os.listdir(PASS_DIR):
    path = os.path.join(PASS_DIR, filename)
    if filename in SKIP or filename.startswith(".") or os.path.isdir(path):
        continue
    with open(path, "rb") as f:
        files_dict[filename] = hashlib.sha1(f.read()).hexdigest()

with open(os.path.join(PASS_DIR, "manifest.json"), "w") as f:
    json.dump(files_dict, f, indent=2)
