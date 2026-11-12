"""Threads: once each morning (Central time) line up her testimony days, today's Hebrew date,
the feasts, Daniel's day counts from the vision and the day's news, and keep ONLY the
connections that genuinely line up. Writes threads.json (today + 60 days of history).

Rules (no forced threads):
  * anniversaries of her dated testimony days, Gregorian (same month and day) and Hebrew (same Hebrew month and day)
  * day counts since one of her days that land exactly on a number from the list below
  * Daniel's 1,260 / 1,290 / 1,335 from the vision: today's day number, and countdowns that hit 207, 52, 40, 7, 3 or 1
  * a biblical feast landing on one of those days
  * a story from the last 24 hours that names a place or phrase she has tied to her testimony
The dates are the same as the testimony timeline in the app (more.js TT); undated or ranged ones are skipped.
Standard library only.
"""
import json
import os
import re
import urllib.request
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

CENTRAL = ZoneInfo("America/Chicago")
START_HOUR = 5
STATION = "https://rileyg410.github.io/end-times-command-station/"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

DAYS = [  # same as the testimony timeline in the app
    ("2024-08-28", "👶", "Elliana was born"),
    ("2025-09-18", "🔥", "my fire vision"),
    ("2026-04-13", "🕰️", "the clock fell"),
    ("2026-04-28", "🤍", "my white-light dream"),
    ("2026-04-30", "🤍", "Riley's white-light dream"),
    ("2026-11-05", "🧸", "the WATCH block"),
]
VISION = date(2025, 9, 18)

# number: (strong?, what it means)
NUM = {
    40: (False, "40, the number of testing and waiting: Moses on the mount, Jesus in the wilderness, and 40 days from the resurrection to the ascension (Acts 1:3)"),
    50: (False, "50, Pentecost and the Jubilee: “ye shall hallow the fiftieth year, and proclaim liberty” (Leviticus 25:10)"),
    52: (True, "52, the days it took to finish Jerusalem's wall (Nehemiah 6:15), finished on 25 Elul, the Hebrew date of my vision. Eliyahu (Elijah) adds up to 52, and my clock stopped at 10:52"),
    70: (False, "70, Daniel's seventy weeks (Daniel 9:24)"),
    120: (False, "120, the disciples in the upper room before the fire fell (Acts 1:15)"),
    153: (False, "153, the fish in the net after the resurrection (John 21:11)"),
    207: (True, "207, the number of the Hebrew word for light, or (אור). My vision to the clock was 207 days"),
    390: (False, "390, the days Ezekiel lay on his side for Israel (Ezekiel 4:5)"),
    430: (False, "430, and “the selfsame day” Israel came out of Egypt (Exodus 12:41)"),
    490: (False, "490, seventy times seven (Daniel 9:24, Matthew 18:22)"),
    500: (False, "500, the brethren who saw the risen Jesus at once (1 Corinthians 15:6)"),
    888: (True, "888, the number of Jesus' name in Greek, Iēsous"),
    1000: (False, "1,000, “one day is with the Lord as a thousand years” (2 Peter 3:8)"),
    1260: (True, "1,260, time, times and half a time (Daniel 12:7, Revelation 12:6)"),
    1290: (True, "1,290 (Daniel 12:11)"),
    1335: (True, "1,335, “Blessed is he that waiteth” (Daniel 12:12)"),
}
COUNTDOWN = {207: "207, the number of light", 52: "52, the days of Nehemiah's wall", 40: "40 days", 7: "one week", 3: "3 days", 1: "tomorrow"}
DANIEL = [(1260, "Daniel's 1,260 days"), (1290, "Daniel's 1,290 days"), (1335, "Daniel's 1,335 days")]

FEASTS = [  # Hebcal event name -> what I call it
    (r"^Chanukah: 1 Candle", "🕎", "Hanukkah begins"), (r"^Tu BiShvat", "🌳", "Tu BiShvat"), (r"^Purim$", "👑", "Purim"),
    (r"^Erev Pesach", "🐑", "Passover"), (r"^Pesach I$", "🍞", "Unleavened Bread"), (r"^Pesach II$", "🌾", "Firstfruits"),
    (r"^Pesach Sheni", "🐑", "the Second Passover"), (r"^Shavuot I$", "🔥", "Shavuot · Pentecost"), (r"^Tish'a B'Av$", "🕯️", "Tisha B'Av"),
    (r"^Rosh Hashana \d", "🎺", "Rosh Hashanah · the Feast of Trumpets"), (r"^Yom Kippur$", "🤍", "Yom Kippur"),
    (r"^Sukkot I$", "⛺", "Sukkot · Tabernacles"), (r"^Shmini Atzeret$", "💧", "Shemini Atzeret"),
]

# places and phrases she has tied to her testimony -> (emoji, what it echoes)
ECHO = [
    (r"\bwall of fire\b", "🔥", "“For I, saith the LORD, will be unto her a wall of fire round about” (Zechariah 2:5), the wall of fire around Israel in my vision"),
    (r"\blion of judah\b|\brising lion\b", "🦁", "“Behold, the Lion of the tribe of Juda… hath prevailed” (Revelation 5:5), my toy lion"),
    (r"\bdoomsday clock\b", "🕰️", "my clock that fell and stopped almost at the top, at 10:52"),
    (r"\b(lights?|flash|glow|fireball)\b[^.]{0,25}\b(in|over|across|lit up)\b[^.]{0,10}\bsky\b|\bsky\b[^.]{0,15}\blit up\b|\blit up the (night )?sky\b", "🤍",
     "“For as the lightning cometh out of the east, and shineth even unto the west” (Matthew 24:27), our white-light dreams"),
    (r"\belijah\b|\beliyahu\b", "🔥", "“Behold, I will send you Elijah the prophet” (Malachi 4:5). Eliyahu adds up to 52, like my clock at 10:52"),
    (r"\bmount carmel\b", "🔥", "“The God that answereth by fire, let him be God” (1 Kings 18:24). Elijah's fire on Carmel, and Elliana means “my God has answered”"),
    (r"\bnehemiah\b|\bwalls? of jerusalem\b|\bjerusalem's (old city )?walls?\b", "🧱", "Nehemiah's wall, finished on 25 Elul in 52 days (Nehemiah 6:15), the Hebrew date of my vision"),
    (r"\bjericho\b", "🕰️", "“And they came to Jericho” (Mark 10:46), where Bartimaeus' story starts. My clock read 10:46 in my photo and stopped at 10:52"),
    (r"\bkamchatka\b", "🌍", "the M7.8 that shook off Kamchatka on the afternoon of my fire vision"),
    (r"\bfervent heat\b", "🔥", "“The elements shall melt with fervent heat” (2 Peter 3:10), the fire over the whole earth in my vision"),
    (r"\bshofar\b", "🎺", "“At the last trump… we shall be changed, in a moment, in the twinkling of an eye” (1 Corinthians 15:52), Riley's tunnel vision in his dream"),
]
NEWS = ["mideast.json", "world.json", "ezekiel.json", "temple.json", "signs.json"]


def nice(d):
    return d.strftime("%B ") + str(d.day) + d.strftime(", %Y")


def heb_one(http_get, ds):
    j = json.loads(http_get(f"https://www.hebcal.com/converter?cfg=json&date={ds}&g2h=1&strict=1", timeout=15))
    return {"hm": j["hm"], "hd": j["hd"], "hy": j["hy"]}


def hebtxt(h):
    return f"{h['hd']} {h['hm']}"


def feasts_of(events):
    out = []
    for ev in events or []:
        for rx, e, name in FEASTS:
            if re.search(rx, ev):
                out.append((e, name))
    return out


def ping(topic, title, msg):
    body = {"topic": topic, "title": title, "message": msg, "priority": 3, "tags": ["thread"], "click": STATION}
    req = urllib.request.Request("https://ntfy.sh/", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status


def day_threads(d, hd, heb, ev):
    """threads for one Gregorian day d. hd = Hebrew date of d, heb = Hebrew dates of her days."""
    out = []
    mine = []  # her days that d is tied to (for feasts landing on them)
    for ds, e, name in DAYS:
        o = date.fromisoformat(ds)
        n = (d - o).days
        if n <= 0:
            continue
        h = heb.get(ds)
        if (d.month, d.day) == (o.month, o.day):
            y = d.year - o.year
            out.append({"k": "anniv", "strong": True, "e": e, "t": f"{y} year{'s' if y > 1 else ''} since {name}",
                        "p": f"{nice(o)} came back around on the calendar today."})
            mine.append(name)
        if h and hd and n > 300 and (h["hm"], h["hd"]) == (hd["hm"], hd["hd"]):
            out.append({"k": "hanniv", "strong": True, "e": e, "t": f"Hebrew anniversary: {name}",
                        "p": f"{name[0].upper() + name[1:]}: {hebtxt(h)}. Today is {hebtxt(hd)} again on God's calendar."})
            mine.append(name)
        if n in NUM:
            strong, why = NUM[n]
            out.append({"k": "count", "strong": strong, "e": e, "t": f"Day {n:,} since {name}", "p": why + "."})
            mine.append(name)
    vn = (d - VISION).days
    for target, label in DANIEL:
        left = target - vn
        if left in COUNTDOWN:
            out.append({"k": "daniel", "strong": left <= 7, "e": "📜", "t": f"{left:,} day{'s' if left > 1 else ''} until {label}",
                        "p": f"Counting from my fire vision, {label} land on {nice(VISION + timedelta(days=target))}. That's {COUNTDOWN[left]} from today."})
        if left == 0:
            out.append({"k": "daniel", "strong": True, "e": "📜", "t": f"Today is {label}", "p": f"Day {target:,} since my fire vision."})
    for fe, fname in feasts_of(ev):
        if mine:
            out.append({"k": "feast", "strong": True, "e": fe, "t": f"{fname[0].upper() + fname[1:]} lands on my day",
                        "p": f"{fname[0].upper() + fname[1:]} falls on the same day as " + ", ".join(sorted(set(mine))) + " above."})
    return out


def news_threads(load_json, now_ts, seen):
    out, used = [], set()
    items = []
    for f in NEWS:
        for s in (load_json(f, {}) or {}).get("stories", []):
            if now_ts - (s.get("t") or 0) < 86400:
                items.append(s)
    items.sort(key=lambda s: -s.get("t", 0))
    for rx, e, why in ECHO:
        if rx in used:
            continue
        for s in items:
            if s.get("id") in seen:
                continue
            m = re.search(rx, (s.get("title") or "") + " . " + (s.get("snip") or ""), re.I)
            if not m:
                continue
            out.append({"k": "news", "strong": False, "e": e, "t": f"“{m.group(0).strip()}” in today's news", "p": "It echoes " + why + ".",
                        "h": s.get("title"), "src": s.get("src"), "link": s.get("link"), "id": s.get("id")})
            used.add(rx)
            break
    return out


def run(http_get, load_json, save_json, now_ts, topic=None, force=False):
    now = datetime.fromtimestamp(now_ts, CENTRAL)
    old = load_json("threads.json", {}) or {}
    today = now.date()
    if not force and (old.get("day") == today.isoformat() or (now.hour < START_HOUR and old.get("day"))):
        return False
    heb = old.get("heb") or {}
    for ds, _, _ in DAYS:
        if ds not in heb:
            heb[ds] = heb_one(http_get, ds)
    end = today + timedelta(days=7)
    cv = json.loads(http_get(f"https://www.hebcal.com/converter?cfg=json&start={today}&end={end}&g2h=1", timeout=20)).get("hdates", {})
    hdt = cv.get(today.isoformat(), {})
    seen = set()
    for h in old.get("hist", []):
        for t in h.get("threads", []):
            if t.get("id"):
                seen.add(t["id"])
    threads = day_threads(today, hdt, heb, hdt.get("events")) + news_threads(load_json, now_ts, seen)
    threads.sort(key=lambda t: (not t["strong"], t["k"] == "news"))
    soon = []
    for i in range(1, 8):
        d = today + timedelta(days=i)
        h = cv.get(d.isoformat(), {})
        for t in day_threads(d, h, heb, h.get("events")):
            if t["strong"] and t["k"] != "daniel":
                soon.append(dict(t, d=d.isoformat(), when=d.strftime("%a, %b ") + str(d.day)))
    hist = [h for h in old.get("hist", []) if h.get("day") != today.isoformat()]
    hist.insert(0, {"day": today.isoformat(), "heb": hdt.get("hebrew") and f"{hdt.get('hd')} {hdt.get('hm')} {hdt.get('hy')}", "threads": threads})
    out = {"day": today.isoformat(), "made": now_ts, "made_ct": now.strftime("%-I:%M %p CT, %a %b %-d"),
           "hebrew": {"hd": hdt.get("hd"), "hm": hdt.get("hm"), "hy": hdt.get("hy"), "he": hdt.get("hebrew"), "events": [e for e in hdt.get("events", []) if not e.startswith("Parashat")]},
           "vision_day": (today - VISION).days, "daniel": [{"n": n, "d": (VISION + timedelta(days=n)).isoformat(), "left": n - (today - VISION).days} for n, _ in DANIEL],
           "threads": threads, "soon": soon[:4], "heb": heb, "hist": hist[:60], "pinged": old.get("pinged")}
    strong = [t for t in threads if t["strong"]]
    if topic and strong and old.get("pinged") != today.isoformat():
        try:
            ping(topic, "🧵 A new thread today", " · ".join(f"{t['e']} {t['t']}" for t in strong[:3]))
            out["pinged"] = today.isoformat()
        except Exception as e:
            print("threads ping error", type(e).__name__, e)
    save_json("threads.json", out)
    print("threads:", today, len(threads), "threads,", len(strong), "strong")
    return True
