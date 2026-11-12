"""Live Israel siren relay (GitHub Actions, runs for hours at a time, standard library only).

Polls the Tzofar (Tzeva Adom) public relay of Home Front Command alerts every few seconds.
When sirens go off it groups them (about 20-45 seconds), then:
  * posts the batch to the public live feed topic the app listens to (FEED_TOPIC)
  * pushes ONE phone alert to the private topic (NTFY_TOPIC secret), never repeating a town
    inside 15 minutes and never more than one push every 3 minutes (extra towns roll into the next one).
"""
import json
import os
import time
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
HEAD = {"User-Agent": UA, "Origin": "https://www.tzevaadom.co.il", "Referer": "https://www.tzevaadom.co.il/"}
FEED = os.environ.get("FEED_TOPIC", "etcs-sirens-live-q8v3n6")
TOPIC = os.environ.get("NTFY_TOPIC", "").strip()
RUN = int(float(os.environ.get("RUN_MINUTES") or "345") * 60)
POLL = 4
CT, IL = ZoneInfo("America/Chicago"), ZoneInfo("Asia/Jerusalem")
THREAT = {0: ("Rocket sirens", "Rockets & missiles", "rotating_light"), 1: ("Hazmat alert", "Hazardous materials", "warning"),
          2: ("Infiltration alert", "Terrorist infiltration", "warning"), 3: ("Earthquake alert", "Earthquake", "earth_africa"),
          4: ("Tsunami alert", "Tsunami", "ocean"), 5: ("Drone alert", "Hostile drone / aircraft", "airplane"),
          6: ("Radiological alert", "Radiological event", "radioactive"), 7: ("Missile alert", "Unconventional missile", "rotating_light"),
          8: ("Alert", "Alert", "warning")}


def get(url, timeout=10):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEAD), timeout=timeout) as r:
        return json.loads(r.read() or b"[]")


def ntfy(body):
    req = urllib.request.Request("https://ntfy.sh/", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status


def load_cities():
    d = get("https://www.tzevaadom.co.il/static/cities.json", 30)
    areas = {str(k): v.get("en", "") for k, v in d.get("areas", {}).items()}
    m = {he: (v.get("en") or he, areas.get(str(v.get("area")), "")) for he, v in d["cities"].items()}
    m["בחלק מהאזורים בארץ"] = ("Parts of the country", "")
    return m


def when(ts):
    d = datetime.fromtimestamp(ts, timezone.utc)
    return d.astimezone(CT).strftime("%-I:%M %p") + " Central · " + d.astimezone(IL).strftime("%-I:%M %p") + " Israel"


def towns_line(towns, n=6):
    return ", ".join(towns[:n]) + (f" and {len(towns) - n} more" if len(towns) > n else "")


def build(batch, cmap):
    """batch: list of raw alerts -> dict with English towns/areas per threat"""
    out = {}
    for a in batch:
        th = a.get("threat", 0) if a.get("threat") in THREAT else 8
        g = out.setdefault(th, {"threat": th, "towns": [], "areas": [], "t": a.get("time") or int(time.time())})
        g["t"] = min(g["t"], a.get("time") or g["t"])
        for c in a.get("cities", []):
            en, ar = cmap.get(c, (c, ""))
            if en not in g["towns"]:
                g["towns"].append(en)
            if ar and ar not in g["areas"]:
                g["areas"].append(ar)
    return list(out.values())


def main():
    start = time.time()
    try:
        cmap = load_cities()
    except Exception as e:
        print("cities error", e)
        cmap = {}
    seen = {}          # alert key -> time seen
    batch, b0, blast = [], 0, 0
    pushed = {}        # (threat, town) -> time pushed to phone
    pend, last_push = [], 0
    polls = errs = 0
    while time.time() - start < RUN:
        now = time.time()
        try:
            items = get("https://api.tzevaadom.co.il/notifications")
            polls += 1
            if polls == 1:
                print("relay reachable, active now:", len(items))
            for a in items or []:
                if a.get("isDrill"):
                    continue
                k = a.get("notificationId") or f"{a.get('time')}-{a.get('threat')}-{'|'.join(sorted(a.get('cities', [])))}"
                if k in seen:
                    continue
                seen[k] = now
                batch.append(a)
                blast = now
                b0 = b0 or now
        except Exception as e:
            errs += 1
            if errs % 30 == 1:
                print("poll error", type(e).__name__, e)
        # flush the batch once it has settled
        if batch and (now - blast >= 10 and now - b0 >= 20 or now - b0 >= 45):
            groups = build(batch, cmap)
            batch, b0 = [], 0
            for g in groups:
                try:
                    ntfy({"topic": FEED, "title": THREAT[g["threat"]][1], "message": json.dumps(g, ensure_ascii=False), "priority": 1})
                except Exception as e:
                    print("feed error", e)
                new = [t for t in g["towns"] if now - pushed.get((g["threat"], t), 0) > 15 * 60]
                if new:
                    pend.append({**g, "towns": new})
            print(time.strftime("%H:%M:%S"), "batch:", [(g["threat"], len(g["towns"])) for g in groups])
        # phone push, throttled
        if pend and TOPIC and now - last_push >= 180:
            merged = {}
            for g in pend:
                m = merged.setdefault(g["threat"], {"threat": g["threat"], "towns": [], "areas": [], "t": g["t"]})
                m["t"] = min(m["t"], g["t"])
                m["towns"] += [t for t in g["towns"] if t not in m["towns"]]
                m["areas"] += [x for x in g["areas"] if x not in m["areas"]]
            pend = []
            gs = sorted(merged.values(), key=lambda g: (g["threat"] not in (0, 7), -len(g["towns"])))
            lead = gs[0]
            title = ("\U0001F6A8\U0001F6A8\U0001F6A8 " if lead["threat"] in (0, 7) else "\U0001F6A8 ") + THREAT[lead["threat"]][0] + " in Israel"
            lines = []
            for g in gs:
                lab = "" if g is lead else THREAT[g["threat"]][0] + ": "
                lines.append(lab + towns_line(g["towns"]) + (f" ({towns_line(g['areas'], 3)})" if g["areas"] else ""))
            lines.append("\U0001F550 " + when(lead["t"]))
            lines.append("Pray for the peace of Jerusalem \U0001F64F")
            try:
                ntfy({"topic": TOPIC, "title": title, "message": "\n".join(lines), "priority": 5 if lead["threat"] in (0, 7) else 4,
                      "tags": [THREAT[lead["threat"]][2]], "click": "https://rileyg410.github.io/end-times-command-station/#sirens"})
                last_push = now
                for g in gs:
                    for t in g["towns"]:
                        pushed[(g["threat"], t)] = now
                print("pushed:", title, sum(len(g["towns"]) for g in gs), "towns")
            except Exception as e:
                print("push error", e)
        for k in [k for k, v in seen.items() if now - v > 3600]:
            del seen[k]
        time.sleep(POLL)
    print(f"done: {polls} polls, {errs} errors")


if __name__ == "__main__":
    main()
