#!/usr/bin/env python3
"""
Scans the Obsidian vault Clients folder and bundles all research into clients-data.json.
Run this whenever you add a new client or update research files.

Usage: python3 scripts/bundle-clients.py
"""
import os, json

VAULT_PATH = "/mnt/c/Users/Cash America/Documents/Obsidian Vault/Clients"
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "clients-data.json")

def bundle():
    clients = []
    for client_dir in sorted(os.listdir(VAULT_PATH)):
        full = os.path.join(VAULT_PATH, client_dir)
        if not os.path.isdir(full) or client_dir.startswith("_"):
            continue

        files = {}
        # Scan key files
        for name in ["README.md", "brief.md", "brand-guide.md"]:
            path = os.path.join(full, name)
            if os.path.exists(path):
                files[name] = open(path).read()

        # Scan subdirs: research/, strategy/
        for subdir in ["research", "strategy"]:
            sd = os.path.join(full, subdir)
            if os.path.isdir(sd):
                for f in os.listdir(sd):
                    if f.endswith(".md"):
                        files[f"{subdir}/{f}"] = open(os.path.join(sd, f)).read()

        if not files:
            continue

        combined = "\n\n".join(f"--- {name} ---\n{content}" for name, content in files.items())
        readme = files.get("README.md", "")
        first_line = readme.split("\n")[0].strip("# ").strip() if readme else ""
        lines = [l.strip() for l in readme.split("\n") if l.strip() and not l.startswith("#") and not l.startswith("**Status")]

        clients.append({
            "slug": client_dir,
            "name": first_line or client_dir.replace("-", " ").title(),
            "description": lines[0][:100] if lines else "",
            "combinedText": combined,
            "totalChars": len(combined),
            "fileCount": len(files)
        })

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(clients, f)

    print(f"Bundled {len(clients)} clients ({sum(c['totalChars'] for c in clients):,} total chars) → {OUTPUT_PATH}")
    for c in clients:
        print(f"  {c['name']} — {c['fileCount']} files, {c['totalChars']:,} chars")

if __name__ == "__main__":
    bundle()
