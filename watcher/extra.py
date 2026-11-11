"""Extra desks: Ezekiel 38 watch, Fig tree & signs watch, prophecy watchmen videos."""
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

import mideast

# ------------------------------------------------------------------ Ezekiel 38
EZ_KEEP_H = 72
EZ_Q = [
    'Russia Syria military OR base OR Tartus OR Hmeimim',
    'Russia Iran military OR drills OR weapons OR jets OR alliance',
    'Turkey Israel military OR warning OR tensions',
    'Erdogan Israel',
    'Turkey Syria troops OR military OR drones OR base',
    'IRGC Syria OR Lebanon OR Iraq OR Golan',
    'Golan OR "northern Israel" OR "Mount Hermon" troops OR military OR rockets OR drones',
    'Hezbollah Israel border OR strike OR rockets OR drones',
    'Russia Turkey Iran summit OR meeting OR alliance OR talks',
    'Libya OR Sudan OR Ethiopia Russia OR Iran military OR base OR weapons',
    'Russian navy Mediterranean OR warships OR Syria',
    'Iran Russia China naval drills',
]
EZ_TAGS = [
    ("russia", r"\brussia\w*|kremlin|putin|moscow"),
    ("iran", r"\biran\w*|tehran|irgc|khamenei|persian"),
    ("turkey", r"\bturk\w*|erdogan|ankara|t\u00fcrkiye"),
    ("allies", r"\blibya\w*|\bsudan\w*|ethiopia\w*|armenia\w*|azerbaij\w*|caucas\w*|houthi\w*|\bchina\b|chinese|\biraq\w*"),
    ("north", r"\bsyria\w*|lebanon|lebanese|golan|hermon|northern israel|damascus|hezbollah|galilee|tartus|hmeimim|latakia"),
]
EZ_ACTOR = r"\brussia\w*|kremlin|putin|\biran\w*|tehran|irgc|\bturk\w*|erdogan|ankara|t\u00fcrkiye|\blibya\w*|\bsudan\w*|ethiopia\w*|hezbollah"
EZ_ISRAEL = r"israel\w*|idf|golan|hermon|syria\w*|lebanon|jerusalem|netanyahu"

# ------------------------------------------------------------------ signs
SG_KEEP_H = 120
SG_Q = [
    '"fig tree" OR "fig trees" OR figs',
    '"out of season" bloom OR blooming OR blossoms OR flowers',
    'blooming November OR "second bloom" OR "blooming again"',
    '"lights in the sky" OR "mysterious lights" OR "strange lights" OR "strange sky"',
    'fireball meteor OR "sky turned" OR "red sky" OR "sun halo" OR "sky glow"',
    'waterspout OR waterspouts',
    'sinkhole OR "mysterious boom" OR "loud boom" OR "booms" mystery',
    '"mass die-off" OR "dead fish" OR "dead birds" OR "locust swarm" OR locusts',
    '"red heifer" OR "third temple"',
    'aurora seen OR "northern lights" visible',
]
SG_CATS = [
    ("fig", r"\bfigs?\b|fig trees?"),
    ("bloom", r"out of season|out-of-season|(bloom\w*|blossom\w*|flower\w*)\W+(\w+\W+){0,4}(in|this|during) (november|december|winter|the fall|autumn)|(second|rare|unusual|early|strange|surprise|winter|november|december) (bloom|blossom|flowering)\w*|blooming again|reblooming|confused (plants|trees|flowers)"),
    ("sky", r"lights? in the sky|mysterious lights?|strange (lights?|sky|clouds?|glow)|fireball|meteor|\bhalo\b|sky turn\w*|red sky|aurora|northern lights|\bufo|\buap\b|sky glow|orbs?\b"),
    ("water", r"waterspouts?"),
    ("earth", r"sinkholes?|mysterious booms?|loud booms?|\bbooms?\b.*\bmyster|ground shak\w*"),
    ("animals", r"die-?offs?|dead (fish|birds)|locusts?|mass stranding|beached whales?"),
    ("temple", r"red heifers?|third temple"),
]
SG_EXCLUDE = (r"recipe|\bjam\b|cookie|newton|salad|cocktail|restaurant|chef|menu|wine|cheese|\bcake\b|fig leaf|"
              r"obituar|podcast|crossword|horoscope|football|soccer|basketball|nfl|nba|mlb|nhl|\bstock\b|shares|"
              r"movie|film|album|song|concert|\bgame\b|video game|fortnite|minecraft|tickets|for sale|real estate|"
              r"\bart\b|artist|exhibit|gallery|reception|fashion|beauty|skincare|perfume|fragrance|brand|startup|business|economy|wedding dress|"
              r"aurora (colorado|illinois|ohio|police|man|woman|teen|school)|city of aurora|\bdeal\b|% off|black friday")

# ------------------------------------------------------------------ videos
CHANNELS = [
    ("wftgd", "Watchman for That Great Day", "UCCyA5a1Dr9J3Pv8NtpCUTYQ"),
    ("river", "Watchman River", "UCg9V6gs2ShQckTTg5RVaFfw"),
    ("lastgen", "The Last Generation", "UCP-d1PQ3B2mCDAfkOFuLdag"),
]
ATOM = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015",
        "m": "http://search.yahoo.com/mrss/"}


def _gnews(q, days):
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": q + f" when:{days}d", "hl": "en-US", "gl": "US", "ceid": "US:en"})


def _pull(urls, http_get):
    def f(u):
        try:
            return mideast.parse(http_get(u, timeout=15), "", True), None
        except Exception as e:
            return [], type(e).__name__
    items, ok, bad = [], 0, 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        for got, err in ex.map(f, urls):
            if err:
                bad += 1
            else:
                ok += 1
                items += got
    return items, ok, bad


def _merge(fresh, old, now_ts, keep_h, keep_max, tagkey):
    keep = []
    for s in fresh + [o for o in old if now_ts - o.get("t", 0) <= keep_h * 3600]:
        dup = next((k for k in keep if k["id"] == s["id"] or mideast._same(k["title"], s["title"])), None)
        if dup is None:
            s.setdefault("seen", now_ts)
            keep.append(s)
        else:
            dup["seen"] = min(dup.get("seen", now_ts), s.get("seen", now_ts))
            dup["t"] = min(dup["t"], s["t"])
            for k in s.get(tagkey, []):
                if k not in dup[tagkey]:
                    dup[tagkey].append(k)
    keep.sort(key=lambda s: -s["t"])
    return keep[:keep_max]


def ezekiel(http_get, load_json, save_json, now_ts, central_time, trusted):
    items, ok, bad = _pull([_gnews(q, 2) for q in EZ_Q], http_get)
    fresh = []
    for it in items:
        t = it["title"]
        low = t.lower()
        if len(t) < 20 or re.search(mideast.EXCLUDE, low) or re.search(mideast.OPINION, low):
            continue
        if not trusted(it["src"]) and not re.search(r"iran international|al-monitor|i24|jerusalem post|times of israel|ynet|kyiv|daily sabah|hurriyet|tass|moscow times|middle east eye|the national|arab news", it["src"].lower()):
            continue
        if not re.search(EZ_ACTOR, low):
            continue
        _, _, mil = mideast.tag_story(t, "", None)
        if not mil and not re.search(EZ_ISRAEL, low):
            continue
        tags = [k for k, rx in EZ_TAGS if re.search(rx, low)]
        ts = min(it["ts"] or now_ts, now_ts)
        if now_ts - ts > EZ_KEEP_H * 3600:
            continue
        fresh.append({"id": mideast._sid(t), "t": ts, "src": it["src"] or "News", "title": t, "link": it["link"],
                      "tags": tags, "mil": mil})
    old = load_json("ezekiel.json", {}).get("stories", [])
    stories = _merge(fresh, old, now_ts, EZ_KEEP_H, 120, "tags") if ok else old
    counts = {k: sum(1 for s in stories if k in s["tags"]) for k, _ in EZ_TAGS}
    counts["mil"] = sum(1 for s in stories if s["mil"])
    save_json("ezekiel.json", {"updated": now_ts, "updated_ct": central_time(now_ts), "keep_hours": EZ_KEEP_H,
                               "feeds_ok": ok, "feeds_bad": bad, "count": len(stories), "counts": counts, "stories": stories})
    print(f"ezekiel 38: {len(stories)} stories ({counts['mil']} military) from {ok} feeds, {bad} failed")


def signs(http_get, load_json, save_json, now_ts, central_time):
    items, ok, bad = _pull([_gnews(q, 4) for q in SG_Q], http_get)
    fresh = []
    for it in items:
        t = it["title"]
        low = t.lower()
        if len(t) < 20 or re.search(SG_EXCLUDE, low) or re.search(mideast.OPINION, low):
            continue
        cats = [k for k, rx in SG_CATS if re.search(rx, low)]
        if not cats:
            continue
        ts = min(it["ts"] or now_ts, now_ts)
        if now_ts - ts > SG_KEEP_H * 3600:
            continue
        fresh.append({"id": mideast._sid(t), "t": ts, "src": it["src"] or "News", "title": t, "link": it["link"], "cats": cats})
    old = []
    for o in load_json("signs.json", {}).get("stories", []):
        low = o["title"].lower()
        cats = [k for k, rx in SG_CATS if re.search(rx, low)]
        if cats and not re.search(SG_EXCLUDE, low):
            o["cats"] = cats
            old.append(o)
    stories = _merge(fresh, old, now_ts, SG_KEEP_H, 100, "cats") if ok else old
    counts = {k: sum(1 for s in stories if k in s["cats"]) for k, _ in SG_CATS}
    save_json("signs.json", {"updated": now_ts, "updated_ct": central_time(now_ts), "keep_hours": SG_KEEP_H,
                             "feeds_ok": ok, "feeds_bad": bad, "count": len(stories), "counts": counts, "stories": stories})
    print(f"signs: {len(stories)} stories from {ok} feeds, {bad} failed")


def videos(http_get, load_json, save_json, now_ts, central_time):
    old = {c["key"]: c for c in load_json("videos.json", {}).get("channels", [])}
    out = []
    for key, name, cid in CHANNELS:
        vids = []
        try:
            root = ET.fromstring(http_get("https://www.youtube.com/feeds/videos.xml?channel_id=" + cid, timeout=15))
            for e in root.findall("a:entry", ATOM)[:12]:
                vid = e.findtext("yt:videoId", "", ATOM)
                pub = e.findtext("a:published", "", ATOM)
                try:
                    ts = int(time.mktime(time.strptime(pub[:19], "%Y-%m-%dT%H:%M:%S"))) - time.timezone
                except Exception:
                    ts = now_ts
                views = e.find("m:group/m:community/m:statistics", ATOM)
                vids.append({"id": vid, "title": e.findtext("a:title", "", ATOM), "t": ts,
                             "views": int(views.get("views", 0)) if views is not None else 0})
        except Exception as ex:
            print("videos", key, type(ex).__name__)
        if not vids and key in old:
            vids = old[key]["videos"]
        out.append({"key": key, "name": name, "cid": cid, "videos": vids})
    save_json("videos.json", {"updated": now_ts, "updated_ct": central_time(now_ts), "channels": out})
    print("videos:", ", ".join(f"{c['name']} {len(c['videos'])}" for c in out))


def run_all(http_get, load_json, save_json, now_ts, central_time, trusted):
    for name, fn in (("ezekiel", lambda: ezekiel(http_get, load_json, save_json, now_ts, central_time, trusted)),
                     ("signs", lambda: signs(http_get, load_json, save_json, now_ts, central_time)),
                     ("videos", lambda: videos(http_get, load_json, save_json, now_ts, central_time))):
        try:
            fn()
        except Exception as e:
            print(name, "error:", type(e).__name__, e)
