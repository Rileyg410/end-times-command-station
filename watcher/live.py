"""Live rooms for the Command Station (runs inside the 10-minute sweep, standard library only).

  cams.json      currently-live Western Wall / Temple Mount / Jerusalem cams (YouTube, checked live + embeddable)
  sirens.json    Israel rocket-siren history in English (Tzofar public relay of Home Front Command alerts)
  temple.json    Third Temple tracker news
  markets.json   gold, silver, oil, wheat, US dollar, S&P 500, bitcoin
  push_state.json  which breaking stories already went to the phone (ntfy)
"""
import json
import os
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import mideast

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def _get(url, timeout=15, headers=None):
    h = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}
    h.update(headers or {})
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=timeout) as r:
        return r.read()


# ------------------------------------------------------------------ live cams
CAM_Q = ["western wall live camera", "kotel live cam", "temple mount live camera", "jerusalem live cam"]
CAM_DEFAULT = [
    {"id": "LMHUcDktP-w", "title": "The Western Wall · Main Plaza", "owner": "Western Wall Heritage Foundation"},
    {"id": "Y3v2WGY-SDc", "title": "The Western Wall", "owner": "Western Wall Heritage Foundation"},
    {"id": "77akujLn4k8", "title": "Western Wall · EarthCam", "owner": "EarthCam"},
    {"id": "zp6LNSoq000", "title": "Western Wall & Temple Archaeological Park", "owner": "Mt. of Olives Prayer Bridge"},
    {"id": "AKGqd20ik_A", "title": "The Kotel", "owner": "Mt. of Olives Prayer Bridge"},
]
CAM_OK = r"western wall|kotel|\u05d4\u05db\u05d5\u05ea\u05dc|temple mount|jerusalem|mount of olives|mt\.? of olives|old city|al-aqsa|dome of the rock"
CAM_NOT = r"replay|highlights|tour|walk(ing)? tour|vlog|news|war|drone footage|\d{4} recap"


def _cam_rank(c):
    o, t = c["owner"].lower(), c["title"].lower()
    if "\u05d4\u05db\u05d5\u05ea\u05dc" in o or "heritage" in o:
        return 0
    if "earthcam" in o:
        return 1
    if "western wall" in t or "kotel" in t:
        return 2
    if "temple mount" in t or "olives" in o:
        return 3
    return 4


def _clean_title(t):
    t = re.sub(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", "", t)
    t = re.sub(r"[\u0590-\u05FF\u0400-\u04FF]+", "", t)
    t = re.sub(r"\s*[|\-\u2013]\s*(live( cam(era)?)?|24/7|\s)*$", "", t, flags=re.I)
    t = re.sub(r"\b(live stream|live cam(era)?|24/7|\blive\b)", "", t, flags=re.I)
    t = re.sub(r"\s*[|]\s*[|]\s*", " \u00b7 ", t)
    t = re.sub(r"\s{2,}", " ", t).strip(" |-\u00b7:")
    return t[:60] or "Jerusalem"


def cams(load_json, save_json, now_ts):
    prev = load_json("cams.json", {}).get("cams", [])
    if prev and now_ts - load_json("cams.json", {}).get("updated", 0) < 1700:
        return  # re-check about every 30 minutes
    found = {}

    def search(q):
        try:
            html = _get("https://www.youtube.com/results?" + urllib.parse.urlencode({"search_query": q, "sp": "EgJAAQ=="})).decode("utf8", "ignore")
        except Exception:
            return []
        out = []
        for m in re.finditer(r'"videoRenderer":\{"videoId":"([\w-]{11})".{0,1500}?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"', html):
            out.append((m.group(1), json.loads('"' + m.group(2) + '"')))
        return out[:6]

    with ThreadPoolExecutor(max_workers=4) as ex:
        for res in ex.map(search, CAM_Q):
            for vid, title in res:
                if re.search(CAM_OK, title.lower()) and not re.search(CAM_NOT, title.lower()):
                    found.setdefault(vid, title)
    for c in prev + CAM_DEFAULT:
        found.setdefault(c["id"], c["title"])

    def check(item):
        vid, title = item
        try:
            html = _get("https://www.youtube.com/watch?v=" + vid).decode("utf8", "ignore")
        except Exception:
            return None
        live = re.search(r'"isLiveNow":(true|false)', html)
        emb = re.search(r'"playableInEmbed":(true|false)', html)
        owner = re.search(r'"ownerChannelName":"((?:[^"\\]|\\.)*)"', html)
        if not live:
            return {"id": vid, "unknown": 1}
        if live.group(1) != "true" or (emb and emb.group(1) != "true"):
            return None
        o = json.loads('"' + owner.group(1) + '"') if owner else ""
        if "\u05d4\u05db\u05d5\u05ea\u05dc" in o:
            o = "Western Wall Heritage Foundation"
        return {"id": vid, "title": _clean_title(title), "owner": o}

    with ThreadPoolExecutor(max_workers=6) as ex:
        checked = [c for c in ex.map(check, list(found.items())[:14]) if c]
    good = [c for c in checked if not c.get("unknown")]
    if not good:  # YouTube didn't answer (bot wall): keep what we had
        print("cams: could not verify, keeping previous list")
        if not prev:
            save_json("cams.json", {"updated": now_ts, "verified": 0, "cams": CAM_DEFAULT})
        return
    good.sort(key=_cam_rank)
    seen, out = set(), []
    for c in good:
        k = c["title"].lower()
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        out.append(c)
    save_json("cams.json", {"updated": now_ts, "verified": 1, "cams": out[:6]})
    print(f"cams: {len(out)} live")


# ------------------------------------------------------------------ sirens (history)
THREAT = {0: "Rockets & missiles", 1: "Hazardous materials", 2: "Terrorist infiltration", 3: "Earthquake",
          4: "Tsunami", 5: "Hostile drone / aircraft", 6: "Radiological event", 7: "Unconventional missile",
          8: "Alert", 9: "Drill"}
CITY_URL = "https://www.tzevaadom.co.il/static/cities.json"
TZ_HEAD = {"Origin": "https://www.tzevaadom.co.il", "Referer": "https://www.tzevaadom.co.il/"}


def city_map(load_json, save_json, now_ts):
    cm = load_json("citymap.json", {})
    if cm.get("map") and now_ts - cm.get("updated", 0) < 86400:
        return cm["map"]
    d = json.loads(_get(CITY_URL, timeout=25))
    areas = {str(k): v.get("en", "") for k, v in d.get("areas", {}).items()}
    m = {he: [v.get("en") or he, areas.get(str(v.get("area")), ""), v.get("countdown", 0)] for he, v in d["cities"].items()}
    m["\u05d1\u05d7\u05dc\u05e7 \u05de\u05d4\u05d0\u05d6\u05d5\u05e8\u05d9\u05dd \u05d1\u05d0\u05e8\u05e5"] = ["Parts of the country", "", 0]
    save_json("citymap.json", {"updated": now_ts, "map": m})
    return m


def sirens(load_json, save_json, now_ts):
    cmap = city_map(load_json, save_json, now_ts)
    hist = json.loads(_get("https://api.tzevaadom.co.il/alerts-history", headers=TZ_HEAD))
    groups = []
    for g in hist:
        als = [a for a in g.get("alerts", []) if not a.get("isDrill")]
        if not als:
            continue
        threats = sorted({a.get("threat", 0) for a in als})
        cities, areas = [], []
        for a in als:
            for c in a.get("cities", []):
                en, ar, _ = cmap.get(c, [c, "", 0])
                if en not in cities:
                    cities.append(en)
                if ar and ar not in areas:
                    areas.append(ar)
        t0 = min(a["time"] for a in als)
        t1 = max(a["time"] for a in als)
        groups.append({"id": g.get("id"), "t": t0, "end": t1, "threat": threats[0], "threats": [THREAT.get(x, "Alert") for x in threats],
                       "cities": cities, "areas": areas, "n": len(cities)})
    groups.sort(key=lambda x: -x["t"])
    day = [g for g in groups if now_ts - g["t"] < 86400]
    week = [g for g in groups if now_ts - g["t"] < 7 * 86400]
    rockets = [g for g in groups if g["threat"] in (0, 7)]
    save_json("sirens.json", {"updated": now_ts, "source": "Tzofar (Tzeva Adom) relay of Home Front Command alerts",
                              "day": len(day), "day_towns": sum(g["n"] for g in day), "week": len(week),
                              "last_rockets": rockets[0]["t"] if rockets else 0, "groups": groups[:60]})
    print(f"sirens: {len(groups)} alert groups, {len(day)} in last 24h")


# ------------------------------------------------------------------ Third Temple tracker
TT_KEEP_H = 24 * 30
TT_Q = [
    '"red heifer" OR "red heifers"',
    '"Temple Institute" OR "Third Temple"',
    '"Temple Mount" Jews OR prayer OR visit OR visitors OR police OR "Ben-Gvir" OR status quo',
    'Sanhedrin',
    '"Temple Mount" OR "Al-Aqsa" sacrifice OR altar OR offering OR priests',
    'kohanim OR "priestly garments" OR "Temple vessels" OR "priestly training"',
    '"Al-Aqsa" Israel OR Jews OR raid OR storm',
]
TT_TAGS = [
    ("heifer", r"red heifers?|\bheifers?\b"),
    ("institute", r"temple institute|third temple|rebuild\w* the temple|temple (plans|blueprint)"),
    ("mount", r"temple mount|al-?aqsa|dome of the rock|har habayit|status quo|western wall|kotel"),
    ("sanhedrin", r"sanhedrin"),
    ("altar", r"\baltar\b|sacrific\w*|offering|kohanim|\bpriest\w*|levites?|temple vessels|incense|menorah|passover lamb"),
]
TT_SRC = r"breaking israel news|israel365|jns|all israel news|israel national news|arutz|cbn|christian post|jerusalem post|times of israel|i24|ynet|israel hayom|haaretz|jewish press|the jewish|algemeiner|middle east eye|al jazeera|anadolu|wafa|the new arab|al-monitor|tps|vos iz neias|hamodia|aish|chabad|kipa|charisma|prophecy|watch"
TT_CTX = r"israel|temple|jerusalem|prophe|bible|biblical|jewish|jews|rabbi|ashes|third temple|kohen|kohanim|levit|shiloh|messiah|torah|zion|al-aqsa|holy|sanhedrin"
TT_NOT = r"exploring|veteran|cattle|livestock|\\bgns\\b|breeder|\\bsale\\b|cult of the|beef|travel guide|things to do|recipe|wedding|concert|football|soccer|basketball|hotel|tour package|for sale|mormon|lds|\bfreemason|masonic|hindu|buddhist|ram mandir|mandir"


def _gnews(q, days):
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + f" when:{days}d", "hl": "en-US", "gl": "US", "ceid": "US:en"})


BING_Q = ['"red heifer"', '"Temple Institute"', '"Third Temple"', '"Temple Mount"', 'Sanhedrin Israel', '"Al-Aqsa" Jews', 'Temple Mount altar OR sacrifice OR priests']


def _bing(raw):
    import xml.etree.ElementTree as ET
    from email.utils import parsedate_to_datetime
    out = []
    for it in ET.fromstring(raw).iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        q = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
        link = q.get("url", [link])[0]
        src = it.findtext("{https://www.bing.com/news/search?q=%22red+heifer%22&format=rss}Source") or ""
        for ch in it:
            if ch.tag.endswith("}Source"):
                src = (ch.text or "").strip()
        try:
            ts = int(parsedate_to_datetime(it.findtext("pubDate")).timestamp())
        except Exception:
            ts = None
        desc = re.sub(r"<[^>]+>", "", it.findtext("description") or "")
        if title and link.startswith("http"):
            out.append({"title": title, "link": link, "src": src, "desc": desc, "ts": ts})
    return out


def temple(http_get, load_json, save_json, now_ts, central_time, trusted, merge):
    def f(u):
        try:
            raw = http_get(u, timeout=15)
            return (_bing(raw) if "bing.com" in u else mideast.parse(raw, "", True)), None
        except Exception as e:
            return [], type(e).__name__
    urls = [_gnews(q, 14) for q in TT_Q] + ["https://www.bing.com/news/search?" + urllib.parse.urlencode({"q": q, "format": "rss", "qft": "sortbydate=\"1\""}) for q in BING_Q]
    items, ok = [], 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        for got, err in ex.map(f, urls):
            if not err:
                ok += 1
                items += got
    fresh = []
    for it in items:
        t = it["title"]
        low = t.lower()
        if len(t) < 20 or re.search(TT_NOT, low) or re.search(mideast.OPINION, low):
            continue
        tags = [k for k, rx in TT_TAGS if re.search(rx, low)]
        ctx = re.search(TT_CTX, low) or re.search(TT_SRC, (it["src"] or "").lower())
        tags = [k for k in tags if k in ("mount", "institute") or ctx]
        if not tags:
            continue
        ts = min(it["ts"] or now_ts, now_ts)
        if now_ts - ts > TT_KEEP_H * 3600:
            continue
        fresh.append({"id": mideast._sid(t), "t": ts, "src": it["src"] or "News", "title": t, "link": it["link"],
                      "snip": mideast.snippet(it.get("desc", ""), t), "tags": tags})
    old = load_json("temple.json", {}).get("stories", [])
    stories = merge(fresh, old, now_ts, TT_KEEP_H, 90, "tags") if ok else old
    counts = {k: sum(1 for s in stories if k in s["tags"]) for k, _ in TT_TAGS}
    save_json("temple.json", {"updated": now_ts, "updated_ct": central_time(now_ts), "keep_hours": TT_KEEP_H,
                              "count": len(stories), "counts": counts, "stories": stories})
    print(f"temple: {len(stories)} stories ({len(fresh)} fresh of {len(items)} raw) from {ok}/{len(urls)} feeds")


# ------------------------------------------------------------------ markets
MKT = [
    ("gold", "GC=F", 2.0), ("silver", "SI=F", 3.5), ("oil", "CL=F", 4.0), ("wheat", "ZW=F", 3.0),
    ("dollar", "DX-Y.NYB", 0.8), ("sp500", "^GSPC", 2.0), ("bitcoin", "BTC-USD", 5.0),
]


def markets(save_json, load_json, now_ts):
    def one(row):
        key, sym, big = row
        try:
            d = json.loads(_get("https://query1.finance.yahoo.com/v8/finance/chart/" + urllib.parse.quote(sym) + "?range=1mo&interval=1d"))
            r = d["chart"]["result"][0]
            m = r["meta"]
            off = m.get("gmtoffset", 0)
            pts = [(ts, c) for ts, c in zip(r.get("timestamp", []), r["indicators"]["quote"][0]["close"]) if c is not None]
            price = m.get("regularMarketPrice") or pts[-1][1]
            mt = m.get("regularMarketTime") or pts[-1][0]
            day = lambda ts: datetime.fromtimestamp(ts + off, timezone.utc).date()
            prev = pts[-2][1] if len(pts) > 1 and day(pts[-1][0]) == day(mt) else pts[-1][1]
            chg = (price - prev) / prev * 100 if prev else 0
            mon = (price - pts[0][1]) / pts[0][1] * 100 if pts else 0
            spark = [round(c, 4) for _, c in pts[:-1]] + [round(price, 4)] if pts and day(pts[-1][0]) == day(mt) else [round(c, 4) for _, c in pts] + [round(price, 4)]
            return key, {"sym": sym, "price": round(price, 4), "prev": round(prev, 4), "chg": round(chg, 2), "month": round(mon, 2),
                         "big": 1 if abs(chg) >= big else 0, "limit": big, "t": mt, "open": 1 if now_ts - mt < 1800 else 0, "spark": spark[-23:]}
        except Exception as e:
            print("market", sym, type(e).__name__, e)
            return key, None
    old = load_json("markets.json", {}).get("m", {})
    out = {}
    with ThreadPoolExecutor(max_workers=7) as ex:
        for k, v in ex.map(one, MKT):
            if v or k in old:
                out[k] = v or old[k]
    save_json("markets.json", {"updated": now_ts, "m": out})
    print("markets:", ", ".join(f"{k} {v['chg']:+.2f}%" for k, v in out.items()))


# ------------------------------------------------------------------ phone alerts: breaking news
def ntfy(topic, title, message, priority=4, tags=None, click=None):
    body = {"topic": topic, "title": title, "message": message, "priority": priority, "tags": tags or ["rotating_light"]}
    if click:
        body["click"] = click
    req = urllib.request.Request("https://ntfy.sh/", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status


def push_breaking(load_json, save_json, now_ts, big_rx, big_not):
    topic = os.environ.get("NTFY_TOPIC", "").strip()
    st = load_json("push_state.json", {})
    sent = [s for s in st.get("sent", []) if now_ts - s.get("t", 0) < 4 * 86400]
    cand = [s for s in load_json("world.json", {}).get("stories", []) if s.get("big")]
    for s in load_json("mideast.json", {}).get("stories", []):
        lt = s["title"].lower()
        if re.search(big_rx, lt) and not re.search(big_not, lt):
            cand.append(s)
    cand = [s for s in cand if now_ts - s.get("seen", s["t"]) < 45 * 60 and now_ts - s["t"] < 6 * 3600]
    new = []
    for s in sorted(cand, key=lambda x: -x["t"]):
        if any(o["id"] == s["id"] or mideast._same(o["title"], s["title"]) for o in sent + new):
            continue
        new.append({"id": s["id"], "title": s["title"], "src": s.get("src", ""), "link": s.get("link", ""), "t": now_ts})
    last = st.get("last_push", 0)
    if new and topic and st.get("init") and now_ts - last < 180:
        print(f"push: {len(new)} waiting (one phone alert per 3 min)")
        new = []  # not marked, so they go out on the next allowed minute
    elif new and topic and st.get("init"):
        try:
            if len(new) == 1:
                ntfy(topic, "\U0001F6A8\U0001F6A8\U0001F6A8 BREAKING", f"{new[0]['title']}\n\u2014 {new[0]['src']}", 5, click=new[0]["link"])
            else:
                lines = "\n".join(f"\u2022 {n['title']} ({n['src']})" for n in new[:3])
                more = f"\n+{len(new) - 3} more in the app" if len(new) > 3 else ""
                ntfy(topic, f"\U0001F6A8\U0001F6A8\U0001F6A8 {len(new)} BIG STORIES", lines + more, 5,
                     click="https://rileyg410.github.io/end-times-command-station/")
            print(f"push: sent {len(new)} breaking")
            last = now_ts
        except Exception as e:
            print("push error:", type(e).__name__, e)
            new = []
    elif new:
        print(f"push: {len(new)} marked (first run or no topic)")
    save_json("push_state.json", {"init": 1 if topic else 0, "updated": now_ts, "last_push": last, "sent": (new + sent)[:200]})


def run_all(http_get, load_json, save_json, now_ts, central_time, trusted, merge, big_rx, big_not):
    for name, fn in (("cams", lambda: cams(load_json, save_json, now_ts)),
                     ("sirens", lambda: sirens(load_json, save_json, now_ts)),
                     ("temple", lambda: temple(http_get, load_json, save_json, now_ts, central_time, trusted, merge)),
                     ("markets", lambda: markets(save_json, load_json, now_ts)),
                     ("elijah", lambda: __import__("elijah").run(http_get, load_json, save_json, now_ts, central_time, merge, ntfy)),
                     ("push", lambda: push_breaking(load_json, save_json, now_ts, big_rx, big_not))):
        if os.environ.get("FAST") == "1" and name in ("cams", "markets", "elijah"):
            continue
        try:
            fn()
        except Exception as e:
            print(name, "error:", type(e).__name__, e)
