"""Minute loop (GitHub Actions, public repo = free minutes, runs ~5h50m then hands off to the next run).

Every 60 seconds:
  * runs the news sweep (fast desks every minute, videos / markets / signs every 10th minute)
  * posts any NEW stories to the public live news topic the app listens to (so the app updates in seconds)
  * publishes the whole data folder to the repo's data branch (base copy + fallback)
  * writes loop.json so the 10-minute fallback sweep knows the loop is alive and stays out of the way
Standard library only.
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.environ.get("DATA_DIR", "datadir"))
RUN = int(float(os.environ.get("RUN_MINUTES") or "350") * 60)
NEWS_FEED = os.environ.get("NEWS_FEED", "etcs-news-live-71d8b2")
REMOTE = os.environ.get("PUSH_URL", "")
EVERY = 60
DESKS = ["mideast.json", "world.json", "ezekiel.json", "temple.json", "signs.json"]
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def ids(f):
    try:
        with open(os.path.join(DATA, f)) as fh:
            return {s.get("id") for s in json.load(fh).get("stories", [])}
    except Exception:
        return None


def stories(f):
    try:
        with open(os.path.join(DATA, f)) as fh:
            return json.load(fh).get("stories", [])
    except Exception:
        return []


def post(body):
    req = urllib.request.Request("https://ntfy.sh/", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status


def slim(s):
    s = dict(s)
    if s.get("snip"):
        s["snip"] = s["snip"][:180]
    return s


def publish_new(new):
    """new: {file: [story, ...]} -> ntfy messages under ~3.5 KB each (max 6 per minute)"""
    chunks, cur, size = [], {}, 20
    for f, arr in new.items():
        for s in arr:
            item = slim(s)
            n = len(json.dumps(item, ensure_ascii=False).encode()) + 4
            if n > 3400:
                continue
            if size + n > 3400 and cur:
                chunks.append(cur)
                cur, size = {}, 20
            cur.setdefault(f, []).append(item)
            size += n
    if cur:
        chunks.append(cur)
    sent = 0
    for c in chunks[:6]:
        try:
            post({"topic": NEWS_FEED, "title": "news", "message": json.dumps({"f": c}, ensure_ascii=False, separators=(",", ":")), "priority": 1})
            sent += 1
        except Exception as e:
            print("feed error", type(e).__name__, e)
    return sent


def git(*a):
    return subprocess.run(["git", *a], cwd=DATA, capture_output=True, text=True, timeout=60)


def push():
    if not REMOTE:
        return False
    for f in os.listdir(DATA):
        if f.endswith(".tmp"):
            os.remove(os.path.join(DATA, f))
    subprocess.run(["rm", "-rf", os.path.join(DATA, ".git")])
    git("init", "-q")
    git("checkout", "-q", "-b", "data")
    git("add", "-A")
    git("-c", "user.name=station", "-c", "user.email=station@users.noreply.github.com", "commit", "-qm", "live " + time.strftime("%FT%TZ", time.gmtime()))
    r = git("push", "-qf", REMOTE, "data")
    if r.returncode:
        print("push error", r.stderr.strip()[-300:])
    return r.returncode == 0


def main():
    start = time.time()
    tick = 0
    while time.time() - start < RUN:
        t0 = time.time()
        before = {f: ids(f) for f in DESKS}
        env = dict(os.environ, DATA_DIR=DATA, FAST="0" if tick % 10 == 0 else "1")
        try:
            r = subprocess.run([sys.executable, os.path.join(HERE, "sweep.py")], env=env, capture_output=True, text=True, timeout=85 if tick % 10 == 0 else 55)
            out = (r.stdout + r.stderr).strip().splitlines()
        except subprocess.TimeoutExpired:
            out = ["sweep timed out"]
        new = {}
        for f in DESKS:
            if before[f] is None:
                continue
            add = [s for s in stories(f) if s.get("id") not in before[f]]
            if add:
                new[f] = add
        sent = publish_new(new) if new else 0
        with open(os.path.join(DATA, "loop.json"), "w") as fh:
            json.dump({"t": int(time.time()), "tick": tick}, fh)
        ok = push()
        took = time.time() - t0
        print(time.strftime("%H:%M:%S"), f"tick {tick}: {sum(len(v) for v in new.values())} new ({sent} msgs), pushed={ok}, {took:.0f}s |",
              " / ".join(l for l in out if "error" in l or "failed" in l and not l.endswith(" 0 failed"))[:400])
        tick += 1
        time.sleep(max(3, EVERY - took))
    print("loop done after", tick, "ticks")


if __name__ == "__main__":
    main()
