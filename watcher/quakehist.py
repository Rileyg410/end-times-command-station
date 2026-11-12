"""Daily quake history (USGS M4.5+) from Sept 18, 2025 to today, for the vision globe replay.

quakehist.json: {start, updated, base, days:[[lat10,lon10,mag10, ...], ...]}  (one list per Central-time day)
base = average daily fire score for Sept 18-19, 2025 (the same window the replay uses on its first day).
Refreshes the last 3 days at most every 3 hours. Standard library only.
"""
import csv
import io
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

CENTRAL = ZoneInfo("America/Chicago")
START = date(2025, 9, 18)
URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&minmagnitude=4.5&orderby=time-asc&starttime={s}&endtime={e}"


def score(m):
    return 2 ** (m - 4.5)


def _fetch(http_get, s_utc, e_utc):
    raw = http_get(URL.format(s=s_utc.strftime("%Y-%m-%dT%H:%M:%S"), e=e_utc.strftime("%Y-%m-%dT%H:%M:%S")), 60).decode()
    out = {}
    for r in csv.DictReader(io.StringIO(raw)):
        try:
            t = datetime.fromisoformat(r["time"].replace("Z", "+00:00")).astimezone(CENTRAL).date()
            out.setdefault(t, []).append((float(r["latitude"]), float(r["longitude"]), float(r["mag"])))
        except Exception:
            pass
    return out


def _utc(d):
    return datetime(d.year, d.month, d.day, tzinfo=CENTRAL).astimezone(timezone.utc)


def run(http_get, load_json, save_json, now_ts):
    old = load_json("quakehist.json", None)
    if old and now_ts - old.get("updated", 0) < 3 * 3600:
        return
    today = datetime.fromtimestamp(now_ts, CENTRAL).date()
    n = (today - START).days + 1
    if old and old.get("start") == START.isoformat() and old.get("base"):
        days = old["days"][: max(0, len(old["days"]) - 3)]
        base = old["base"]
        frm = START + timedelta(days=len(days))
        got = _fetch(http_get, _utc(frm), _utc(today + timedelta(days=1)))
    else:
        got = _fetch(http_get, _utc(START - timedelta(days=3)), _utc(today + timedelta(days=1)))
        wk = [sum(score(q[2]) for q in got.get(START + timedelta(days=i), [])) for i in range(0, 2)]
        base = round(sum(wk) / len(wk), 2)
        days, frm = [], START
    d = frm
    while d <= today:
        flat = []
        for la, lo, m in got.get(d, []):
            flat += [round(la * 10), round(lo * 10), round(m * 10)]
        days.append(flat)
        d += timedelta(days=1)
    save_json("quakehist.json", {"start": START.isoformat(), "updated": now_ts, "base": base, "days": days[:n]})
