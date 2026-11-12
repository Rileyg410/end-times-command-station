"""Elijah watch: stays quiet unless the news shows someone publicly claiming to be Elijah or one of the
two witnesses (Revelation 11), or something unusual at Mount Carmel or the Mount of Olives.
Filtered tightly; a real new match pings the phone (shares the 3-minute phone throttle).
Standard library only.
"""
import os
import re
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

import mideast

KEEP_H = 24 * 14
Q = [
    '"claims to be Elijah" OR "claiming to be Elijah" OR "claimed to be Elijah" OR "says he is Elijah" OR "I am Elijah"',
    '"Elijah the prophet" OR "prophet Elijah" claims OR returned OR return OR appeared',
    '"two witnesses" Revelation OR prophecy OR prophets OR Jerusalem',
    '"Mount Carmel" Israel OR Haifa',
    '"Mount of Olives" OR "Mt. of Olives"',
]
BING_Q = ['"claims to be Elijah"', '"two witnesses" Revelation', '"Mount of Olives"', '"Mount Carmel" Haifa']

NAME = r"(elijah|elias|eliyahu)"
CLAIM = (r"(claim\w*|claiming|says? (he|she) is|said (he|she) (is|was)|believes? (he|she) is|self-(proclaimed|styled|declared)|"
         r"calls? (himself|herself)|calling (himself|herself)|proclaim\w*( himself| herself)?|declar\w*( himself| herself)?|"
         r"identif\w* (himself|herself|as)|posing as|poses as)( to be| as)?( the)?( prophet| biblical)? " + NAME + r"\b")
RETURN = r"(prophet " + NAME + r"|" + NAME + r" the prophet) (has )?(returned|is back|has come|appeared|is here|is alive)"
WITNESS = r"\btwo witnesses\b"
WIT_CTX = r"claim\w*|appear\w*|preach\w*|jerusalem|sackcloth|prophe\w*|says? (they|he|she)|self-|revelation 11|arrived|identified"
PLACE = r"mount carmel|mt\.? carmel|mount of olives|mt\.? of olives|har hazeitim"
PLACE_ODD = (r"fire|blaze|wildfire|burn\w*|earthquake|quake|tremor|split\w*|crack\w*|fissure|rift|sinkhole|collaps\w*|"
             r"miracle|mysterious|strange|unusual|unexplained|phenomen\w*|lightning|light in the sky|altar|sacrific\w*|"
             r"elijah|messiah|prophet|sighting|appear\w*|spring\w* (up|forth)|water gush\w*|explosion|blast|missile|rocket|drone|"
             r"interceptor|shrapnel")
CARMEL_CTX = r"israel|haifa|druze|daliyat|isfiya|carmel forest|idf|hezbollah|northern"
NOT = (r"\b(school|high school|academy|hospital|health|clinic|church|parish|catholic|baptist|cemetery|funeral|obituar\w*|"
       r"basketball|football|soccer|baseball|softball|volleyball|wrestling|track|athlet\w*|team|coach|game|season|"
       r"film|movie|actor|album|song|singer|rapper|novel|book review|recipe|hotel|tour|travel|real estate|"
       r"book|books|author|sermon|sermons|podcast|devotional|bible study|commentary|lesson|explained|who (is|are|was)|what (is|are|does)|meaning|teaching|"
       r"waco|branch davidian|koresh|pennsylvania|illinois|ohio|tennessee|county|township)\b|elijah (wood|cummings|mcclain|muhammad|craig|blue|moore|hood|kelley|mitchell)")
LABEL = {"claim": "Claims to be Elijah", "witness": "Two witnesses", "carmel": "Mount Carmel", "olives": "Mount of Olives"}


def _gnews(q, days):
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + f" when:{days}d", "hl": "en-US", "gl": "US", "ceid": "US:en"})


def classify(title):
    low = title.lower()
    if len(title) < 20 or re.search(NOT, low) or re.search(mideast.OPINION, low):
        return None
    if re.search(CLAIM, low) or re.search(RETURN, low):
        return "claim"
    if re.search(WITNESS, low) and re.search(WIT_CTX, low) and not re.search(r"\b(trial|court|testif\w*|police|jury|crash|shooting|murder|accident)\b", low):
        return "witness"
    m = re.search(PLACE, low)
    if m and re.search(PLACE_ODD, low):
        if "carmel" in m.group(0):
            return "carmel"
        return "olives"
    return None


def run(http_get, load_json, save_json, now_ts, central_time, merge, ntfy):
    from live import _bing

    def f(u):
        try:
            raw = http_get(u, timeout=15)
            return (_bing(raw) if "bing.com" in u else mideast.parse(raw, "", True)), None
        except Exception as e:
            return [], type(e).__name__
    urls = [_gnews(q, 7) for q in Q] + ["https://www.bing.com/news/search?" + urllib.parse.urlencode({"q": q, "format": "rss", "qft": "sortbydate=\"1\""}) for q in BING_Q]
    items, ok = [], 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        for got, err in ex.map(f, urls):
            if not err:
                ok += 1
                items += got
    fresh = []
    for it in items:
        t = it["title"]
        k = classify(t)
        if not k:
            continue
        if k == "carmel" and not re.search(CARMEL_CTX, (t + " " + (it.get("src") or "")).lower()) and not re.search(r"times of israel|jerusalem post|ynet|haaretz|i24|israel", (it.get("src") or "").lower()):
            continue
        ts = min(it["ts"] or now_ts, now_ts)
        if now_ts - ts > KEEP_H * 3600:
            continue
        fresh.append({"id": mideast._sid(t), "t": ts, "src": it["src"] or "News", "title": t, "link": it["link"],
                      "snip": mideast.snippet(it.get("desc", ""), t), "tags": [k]})
    old = load_json("elijah.json", {}).get("stories", [])
    stories = merge(fresh, old, now_ts, KEEP_H, 40, "tags") if ok else old
    stories = [s for s in stories if classify(s["title"])]
    save_json("elijah.json", {"updated": now_ts, "updated_ct": central_time(now_ts), "keep_hours": KEEP_H, "feeds_ok": ok,
                              "count": len(stories), "stories": stories})
    print(f"elijah: {len(stories)} matches ({len(fresh)} fresh of {len(items)} raw) from {ok}/{len(urls)} feeds")

    # phone alert for a real new match (first run only marks what's there)
    topic = os.environ.get("NTFY_TOPIC", "").strip()
    st = load_json("elijah_state.json", {})
    sent = [i for i in st.get("sent", []) if isinstance(i, str)][:300]
    new = [s for s in stories if s["id"] not in sent and now_ts - s["t"] < 2 * 86400]
    ps = load_json("push_state.json", {})
    if new and topic and st.get("init"):
        if now_ts - ps.get("last_push", 0) < 180:
            print(f"elijah push: {len(new)} waiting (one phone alert per 3 min)")
            new = []
        else:
            try:
                if len(new) == 1:
                    s = new[0]
                    ntfy(topic, "\U0001F525 ELIJAH WATCH", f"{LABEL[s['tags'][0]]}: {s['title']}\n\u2014 {s['src']}", 5, ["fire"], s["link"])
                else:
                    lines = "\n".join(f"\u2022 {s['title']} ({s['src']})" for s in new[:3])
                    ntfy(topic, f"\U0001F525 ELIJAH WATCH \u00b7 {len(new)} new", lines, 5, ["fire"], "https://rileyg410.github.io/end-times-command-station/")
                ps["last_push"] = now_ts
                save_json("push_state.json", ps)
                print(f"elijah push: sent {len(new)}")
            except Exception as e:
                print("elijah push error:", type(e).__name__, e)
                new = []
    elif new:
        print(f"elijah push: {len(new)} marked (first run or no topic)")
    save_json("elijah_state.json", {"init": 1 if topic else 0, "updated": now_ts, "sent": [s["id"] for s in new] + sent})
