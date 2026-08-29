"""Incrementa VERSION_CODE y el parche de VERSION_NAME para el próximo APK."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path


def bump_name(name: str) -> str:
    parts = [p for p in name.split(".") if p != ""]
    while len(parts) < 3:
        parts.append("0")
    try:
        parts[-1] = str(int(parts[-1]) + 1)
    except ValueError:
        parts.append("1")
    return ".".join(parts)


def leer_props(path: Path) -> dict[str, str]:
    vals = {"VERSION_CODE": "2", "VERSION_NAME": "1.0.1"}
    if not path.exists():
        return vals
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip()
    return vals


def codigo_publicado(url: str, key: str) -> tuple[int, str] | None:
    req = urllib.request.Request(
        f"{url}/storage/v1/object/apk/latest.json",
        headers={"Authorization": f"Bearer {key}", "apikey": key},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            remote = json.loads(resp.read().decode("utf-8"))
        code = int(remote.get("versionCode") or 0)
        name = str(remote.get("version") or "")
        return code, name
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, ValueError, TypeError):
        return None


def main() -> None:
    p = Path("android/version.properties")
    vals = leer_props(p)
    code = int(vals.get("VERSION_CODE") or "1")
    name = vals.get("VERSION_NAME") or "1.0.0"

    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if url.startswith("https://") and len(key) > 20:
        remoto = codigo_publicado(url, key)
        if remoto and remoto[0] > code:
            code = remoto[0]
            if remoto[1]:
                name = remoto[1]

    code += 1
    name = bump_name(name)
    p.write_text(
        "# Lo incrementa GitHub Actions en cada APK publicado. No hace falta editarlo a mano.\n"
        f"VERSION_CODE={code}\n"
        f"VERSION_NAME={name}\n",
        encoding="utf-8",
    )

    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"name={name}\n")
            f.write(f"code={code}\n")
            f.write(f"archivo=Dilo-{name}.apk\n")
    print(f"APK Dilo {name} ({code})")


if __name__ == "__main__":
    main()
