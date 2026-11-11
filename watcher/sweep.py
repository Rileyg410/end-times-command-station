"""END TIMES COMMAND STATION - news sweep (runs on GitHub Actions about every 10 minutes, free).

Writes two files to the data branch:
  mideast.json  Israel / Iran / Middle East desk (same desk as Watchman Radar)
  world.json    world watch: war, nuclear, quakes & disasters, cyber & blackouts, money, Temple Mount, plagues
Standard library only.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mideast  # noqa: E402

DATA = os.environ.get("DATA_DIR", "datadir")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
CENTRAL = ZoneInfo("America/Chicago")
NOW_TS = int(time.time())
KEEP_HOURS = 48
KEEP_MAX = 150

TRUSTED = [
    "reuters", "associated press", "ap news", "apnews", "bbc", "cnn", "fox news", "cbs news", "nbc news",
    "abc news", "al jazeera", "times of israel", "jerusalem post", "defense news", "breaking defense",
    "the war zone", "twz", "usni news", "military times", "stars and stripes", "newsweek",
    "kyiv independent", "bloomberg", "wall street journal", "new york times", "washington post",
    "the guardian", "air & space forces", "navy times", "yonhap", "nhk", "kyodo", "japan times",
    "euronews", "sky news", "france 24", "dw", "politico", "axios", "the hill", "i24", "ynet",
    "israel hayom", "the telegraph", "financial times", "cbc", "military.com", "the aviationist",
    "naval news", "defense one", "task & purpose", "united press international", "upi",
    "nikkei", "south china morning post", "the independent", "daily mail", "new york post",
    "washington examiner", "daily wire", "wion", "arab news", "jns", "all israel news",
    "ukrainska pravda", "kyiv post", "the moscow times", "meduza", "tass", "rt", "nk news",
    "forces news", "uk defence journal", "korea times", "korea herald", "al arabiya", "gulf news",
    "middle east eye", "times of india", "hindustan times", "cbs", "abc", "nbc", "msn", "yahoo",
    "the national", "anadolu", "pbs", "npr", "cnbc", "marketwatch", "barron", "usgs", "weather.com",
    "the weather channel", "accuweather", "the record", "bleepingcomputer", "wired", "the verge",
    "cbn", "christian post", "breaking israel news", "iran international", "al-monitor",
]


def trusted(src):
    s = (src or "").lower()
    return any(t == s or s.startswith(t) or (" " + t) in (" " + s) for t in TRUSTED)


def http_get(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def load_json(name, default):
    try:
        with open(os.path.join(DATA, name)) as f:
            return json.load(f)
    except Exception:
        return default


def save_json(name, obj):
    os.makedirs(DATA, exist_ok=True)
    p = os.path.join(DATA, name)
    with open(p + ".tmp", "w") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(p + ".tmp", p)


def central_time(ts):
    return datetime.fromtimestamp(ts, timezone.utc).astimezone(CENTRAL).strftime("%-I:%M %p CT, %a %b %-d")


# ------------------------------------------------------------------ world watch
WORLD_Q = [
    "\"nuclear weapon\" OR \"nuclear threat\" OR \"nuclear war\" OR \"nuclear test\" OR \"uranium enrichment\"",
    "\"Temple Mount\" OR \"Third Temple\" OR \"red heifer\" OR \"Al-Aqsa\"",
    "earthquake OR tsunami OR \"volcano erupts\" OR \"volcanic eruption\"",
    "hurricane OR typhoon OR wildfire OR \"flash flooding\" OR tornado disaster",
    "cyberattack OR \"cyber attack\" OR ransomware OR hackers",
    "blackout OR \"power outage\" OR \"internet outage\" OR \"power grid\"",
    "\"bank collapse\" OR \"bank failure\" OR \"stock market\" plunge OR crash OR selloff",
    "CBDC OR \"digital ID\" OR \"digital currency\" OR \"digital euro\"",
    "Russia Ukraine war OR NATO troops OR Putin nuclear",
    "China Taiwan military OR \"North Korea\" missile",
    "\"World War\" OR \"martial law\" OR \"state of emergency\" OR coup",
    "outbreak OR pandemic OR \"bird flu\" OR ebola",
]
WORLD_DIRECT = [
    ("BBC", "https://feeds.bbci.co.uk/news/world/rss.xml"),
    ("The Guardian", "https://www.theguardian.com/world/rss"),
    ("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"),
]
CATS = [
    ("nuclear", r"nuclear|uranium|enrich\w*|warheads?|\bicbms?\b|atomic|radiation"),
    ("temple", r"temple mount|third temple|red heifer|al-aqsa|al aqsa|dome of the rock|sanhedrin|western wall"),
    ("disaster", r"earthquakes?|\bquakes?\b|tsunami|volcan\w*|eruptions?|hurricane|typhoon|cyclone|tornado\w*|wildfires?|\bfloods?\b|flooding|landslides?|sinkhole|famine|drought|locusts?"),
    ("cyber", r"cyber\w*|\bhack(ed|ers?|ing)?\b|ransomware|blackouts?|power outages?|internet (outage|shutdown|blackout)|power grid|\bgrid\b|outage"),
    ("money", r"bank(s|ing)? (collapse|failure|run|crisis)|bank fail\w*|market (crash|plunge|selloff|sell-off|turmoil|rout)|stocks? (plunge|tumble|crash|sink|slide)|(dow|s&p|nasdaq) (plunge|drop|tumble|sink)s?|recession|hyperinflation|cbdc|digital (currency|id|euro|dollar)|debt crisis|gold (price|hits|record|soars)|bitcoin (crash|plunge)|financial crisis"),
    ("plague", r"outbreak|pandemic|epidemic|bird flu|h5n1|ebola|marburg|measles|\bplague\b|mpox|new virus"),
    ("war", r"\bwar\b|invasion|invad\w*|\btroops?\b|missiles?|air ?strikes?|\bstrikes? on\b|\bnato\b|drone (attack|strike)s?|offensive|martial law|\bcoup\b|mobiliz\w*|warships?|military"),
]
BIG = (r"nuclear (strike|attack|war|launch|detonat\w*|explosion|blast|alert)|nuclear test|world war (3|iii|three)|\bww(3|iii)\b|martial law|"
       r"magnitude[- ](7\.[5-9]|[89])|\b(7\.[5-9]|[89]\.\d)[- ]magnitude|\bm(7\.[5-9]|[89]\.\d)\b|tsunami warning|"
       r"assassinat\w*|\bcoup\b|overthrow\w*|bank run|market crash|stocks? crash|nationwide (blackout|outage)|"
       r"grid (down|collapse)|declares? war|declaration of war|invades|full-scale invasion|"
       r"(temple mount|al-aqsa).{0,60}(sacrifice|altar|riot|clash|storm|raid|fire)|third temple|red heifers? (sacrific|slaughter|burn)|"
       r"claims? to be (elijah|the messiah)|state of emergency")
W_EXCLUDE = (r"\b(podcast|quiz|recipe|crossword|horoscope|football|soccer|basketball|tennis|nfl|nba|mlb|nhl|uefa|fifa|"
             r"celebrity|box office|word of the day|newsletter|in pictures|photos of the day|fashion|memoir|golf|"
             r"video game|gta|movie|film review|tv show|album|concert|festival|recap|best deals|how to watch|"
             r"star wars|marvel|anniversary of|years ago|on this day|first world war|second world war|world war (i|ii|one|two)|ww(i|ii|1|2)|armistice|veterans?|remembrance|wwii|1918|1945)\b")
BIG_NOT = r"record high|recover\w*|rebound\w*|lessons|history|historic"


def world_run():
    jobs = [(n, u, False) for n, u in WORLD_DIRECT]
    jobs += [("", "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": q + " when:1d", "hl": "en-US", "gl": "US", "ceid": "US:en"}), True) for q in WORLD_Q]

    def fetch(j):
        try:
            return mideast.parse(http_get(j[1], timeout=15), j[0], j[2]), None
        except Exception as e:
            return [], type(e).__name__

    items, ok, bad = [], 0, 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        for got, err in ex.map(fetch, jobs):
            if err:
                bad += 1
            else:
                ok += 1
                items += got
    fresh = []
    for it in items:
        t = it["title"]
        low = t.lower()
        if len(t) < 20 or re.search(W_EXCLUDE, low) or re.search(mideast.OPINION, low) or re.search(mideast.OPINION, it["link"].lower()):
            continue
        if not trusted(it["src"]):
            continue
        cats = [k for k, rx in CATS if re.search(rx, low)]
        if not cats:
            continue
        if not it["g"] and cats == ["war"] and not re.search(r"\bwar\b|invasion|missile|nato|nuclear", low):
            continue  # general outlet copies: keep the real end-times headlines only
        ts = it["ts"] or NOW_TS
        ts = min(ts, NOW_TS)
        if NOW_TS - ts > KEEP_HOURS * 3600:
            continue
        fresh.append({"id": mideast._sid(t), "t": ts, "src": it["src"] or "News", "title": t, "link": it["link"],
                      "snip": mideast.snippet(it["desc"], t), "cats": cats, "big": 1 if re.search(BIG, low) and not re.search(BIG_NOT, low) else 0,
                      "g": 1 if it["g"] else 0})
    fresh.sort(key=lambda s: (s["g"], -s["t"]))
    old = load_json("world.json", {}).get("stories", []) if ok else []
    keep = []
    for s in fresh + [o for o in old if NOW_TS - o.get("t", 0) <= KEEP_HOURS * 3600]:
        dup = next((k for k in keep if k["id"] == s["id"] or mideast._same(k["title"], s["title"])), None)
        if dup is None:
            s.setdefault("seen", NOW_TS)
            keep.append(s)
        else:
            dup["seen"] = min(dup.get("seen", NOW_TS), s.get("seen", NOW_TS))
            dup["t"] = min(dup["t"], s["t"])
            if not dup.get("snip") and s.get("snip"):
                dup["snip"] = s["snip"]
    keep = [k for k in keep if not re.search(W_EXCLUDE, k["title"].lower())]
    for k in keep:
        lt = k["title"].lower()
        k["big"] = 1 if re.search(BIG, lt) and not re.search(BIG_NOT, lt) else 0
    keep.sort(key=lambda s: -s["t"])
    keep = keep[:KEEP_MAX] if ok else load_json("world.json", {}).get("stories", [])
    counts = {k: sum(1 for s in keep if k in s["cats"]) for k, _ in CATS}
    counts["big"] = sum(1 for s in keep if s.get("big"))
    save_json("world.json", {"updated": NOW_TS, "updated_ct": central_time(NOW_TS), "keep_hours": KEEP_HOURS,
                             "feeds_ok": ok, "feeds_bad": bad, "count": len(keep), "counts": counts, "stories": keep})
    print(f"world watch: {len(keep)} stories ({counts['big']} big) from {ok} feeds, {bad} failed")


if __name__ == "__main__":
    try:
        mideast.run(http_get, load_json, save_json, NOW_TS, central_time, trusted)
    except Exception as e:
        print("mideast error:", type(e).__name__, e)
    try:
        world_run()
    except Exception as e:
        print("world error:", type(e).__name__, e)
