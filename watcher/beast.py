"""Mark of the beast tracker + Peace and safety meter (runs on the 10-minute ticks, standard library only).

  beast.json  news on digital IDs, CBDCs, palm/face/biometric pay, chip implants, social credit, cashless moves,
              countries named in it, and the Atlantic Council CBDC tracker's world status (checked daily)
  peace.json  how often the news says "peace and security" / peace deals / ceasefires / normalization / covenants,
              compared with the usual day, plus the latest headlines
  A phone alert only for a big peace spike or a major Israel peace / normalization / covenant deal.
"""
import html as htmlmod
import json
import os
import re
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from zoneinfo import ZoneInfo

import mideast

CENTRAL = ZoneInfo("America/Chicago")
APP = "https://rileyg410.github.io/end-times-command-station/"


def _gnews(q, days):
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + f" when:{days}d", "hl": "en-US", "gl": "US", "ceid": "US:en"})


def _bingu(q):
    return "https://www.bing.com/news/search?" + urllib.parse.urlencode({"q": q, "format": "rss", "qft": 'sortbydate="1"'})


def _pull(urls, http_get):
    from live import _bing

    def f(u):
        try:
            raw = http_get(u, timeout=15)
            return (_bing(raw) if "bing.com" in u else mideast.parse(raw, "", True)), None
        except Exception as e:
            return [], type(e).__name__
    items, ok = [], 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        for got, err in ex.map(f, urls):
            if not err:
                ok += 1
                items += got
    return items, ok


JUNK = (r"prestocks|price today|live price|market cap|converter|exchange rate|social credit (movement|party)|price prediction|presale|pre-sale|airdrop|meme ?coin|token sale|\bxrp\b|shiba|dogecoin|sponsored|stocks? to buy|"
        r"shares (rise|fall|jump|drop|surge)|\bquiz\b|horoscope|recipe|crossword|\bnfl\b|\bnba\b|football|soccer|basketball")


def _dedupe(items, classify, now_ts, keep_h):
    out = []
    for it in items:
        t = (it.get("title") or "").strip()
        low = t.lower()
        if len(t) < 20 or re.search(JUNK, low) or re.search(mideast.OPINION, low) or re.search(mideast.OPINION, (it.get("link") or "").lower()):
            continue
        tags = classify(low)
        if not tags:
            continue
        ts = min(it.get("ts") or now_ts, now_ts)
        if now_ts - ts > keep_h * 3600:
            continue
        s = {"id": mideast._sid(t), "t": ts, "src": it.get("src") or "News", "title": t, "link": it.get("link", ""),
             "snip": mideast.snippet(it.get("desc", ""), t), "tags": tags}
        dup = next((o for o in out if o["id"] == s["id"] or mideast._same(o["title"], t)), None)
        if dup:
            dup["t"] = min(dup["t"], ts)
            dup["tags"] += [k for k in tags if k not in dup["tags"]]
        else:
            out.append(s)
    return out


# ====================================================================== MARK OF THE BEAST
MARK_Q = [
    'CBDC OR "central bank digital currency" OR "digital euro" OR "digital yuan" OR "e-CNY" OR "digital rupee" OR "digital pound"',
    '"digital ID" OR "digital identity" OR "identity wallet" OR "national ID app" OR eIDAS OR Aadhaar',
    '"palm payment" OR "palm scan" OR "pay with your face" OR "face payment" OR "biometric payment" OR "palm recognition"',
    '"microchip implant" OR "chip implant" OR "implanted chip" OR Neuralink OR "brain implant" OR "RFID implant"',
    '"social credit" OR "social credit score" OR "carbon footprint tracker" OR "personal carbon allowance"',
    'cashless OR "cash ban" OR "ban cash" OR "war on cash" OR "end of cash" OR "programmable money"',
    '"age verification" OR "digital driver\'s license" OR "mobile ID" OR Worldcoin OR "World ID" OR "iris scan"',
    '"facial recognition" OR "biometric surveillance" OR "biometric data"',
]
MARK_BING = ['"digital ID"', "CBDC", '"palm payment"', '"social credit"']
MARK_CATS = [
    ("cbdc", r"\bcbdcs?\b|central bank digital currenc|digital (euro|yuan|rupee|pound|dollar|naira|ruble|rouble|shekel|real|won|yen|dirham|riyal|lira|tenge|hryvnia)\b|"
             r"e-cny|e-rupee|e-?naira|sand ?dollar|jam-dex|\bdrex\b|mbridge|programmable money|digital currenc"),
    ("id", r"digital (id|ids|identity|identities|identification)\b|national id (card|app|system|scheme|number)|\beidas\b|identity wallet|\bid wallet|"
           r"aadhaar|biometric (id|identity|passport|card|registration|enrol\w*)|mobile (id|driver'?s licen[cs]e)\b|digital driver'?s licen[cs]e|"
           r"age verification|age checks?|verify (your|their) (age|identity)|world ?id\b|worldcoin|world network|iris scan"),
    ("bio", r"palm (pay\w*|scan\w*|vein|recognition|print)|pay(ing|ment|s)? (with|by) (your |a |their )?(face|palm|hand|fingerprint)|face (pay\w*|scan\w*)|"
            r"facial (recognition|verification|scan\w*)|biometric (pay\w*|check\w*|authenticat\w*|scan\w*|data|surveillance|gates?)|smile to pay"),
    ("chip", r"(microchip|chip|rfid|nfc) implant\w*|implant\w* (a )?(chip|microchip)|chipped (employees|workers|people|humans|hand)|"
             r"brain(-| )(chip|implant|computer interface)|neuralink|\bbci\b"),
    ("social", r"social credit|social scor\w*|citizen scor\w*|carbon (allowance|footprint) (card|tracker|limit|tracking)|personal carbon|"
               r"behavio(u)?r(al)? scor\w*|digital (social|behavio(u)?r) scor\w*"),
    ("cash", r"cashless|(ban|bans|banning|banned|phase out|phasing out|scrap\w*|end of|war on|abolish\w*|ditch\w*|kill\w*) (on )?(physical )?cash\b|"
             r"cash (ban|limit|cap|restriction|payment limit|withdrawal limit)s?|(limit|cap|ceiling)s? on cash|right to (use|pay with|pay in) cash|"
             r"(refuse|accept|stop accepting|no longer accept)\w* cash|atms? (disappear\w*|closing|removed|vanish\w*)|go(ing)? cash-?free|cash-?free"),
]
MARK_LABEL = {"cbdc": "Digital currency", "id": "Digital ID", "bio": "Palm & face", "chip": "Chips & implants", "social": "Social credit", "cash": "Cashless"}

COUNTRIES = [
    ("US", "United States", r"\bu\.s\.|\bus\b(?! dollar)|united states|america\b|american|washington|trump|congress|senate|federal reserve|\bfed\b|\btexas|california|florida|new york"),
    ("EU", "European Union", r"\beu\b|european|\becb\b|eurozone|euro area|brussels|digital euro|eidas"),
    ("GB", "United Kingdom", r"\buk\b|britain|british|england|bank of england|starmer|london|scotland|\bwales"),
    ("CN", "China", r"china|chinese|beijing|shanghai|pboc|people'?s bank|e-cny|digital yuan|alipay|wechat|tencent"),
    ("IN", "India", r"india|indian|\brbi\b|aadhaar|e-rupee|digital rupee|modi|upi\b"),
    ("RU", "Russia", r"russia|russian|kremlin|putin|digital (ruble|rouble)"),
    ("BR", "Brazil", r"brazil|\bdrex\b|\bpix\b"),
    ("NG", "Nigeria", r"nigeria|e-?naira"),
    ("BS", "Bahamas", r"bahamas|sand ?dollar"),
    ("JM", "Jamaica", r"jamaica|jam-dex"),
    ("JP", "Japan", r"japan|japanese|\bboj\b|my ?number"),
    ("KR", "South Korea", r"south korea|korean|\bseoul"),
    ("AU", "Australia", r"australia|aussie"),
    ("NZ", "New Zealand", r"new zealand"),
    ("CA", "Canada", r"canada|canadian"),
    ("CH", "Switzerland", r"switzerland|swiss"),
    ("SE", "Sweden", r"sweden|swedish|riksbank|e-krona"),
    ("NO", "Norway", r"norway|norwegian"),
    ("DK", "Denmark", r"denmark|danish"),
    ("DE", "Germany", r"germany|german|bundesbank"),
    ("FR", "France", r"france|french"),
    ("IT", "Italy", r"italy|italian"),
    ("ES", "Spain", r"spain|spanish"),
    ("NL", "Netherlands", r"netherlands|dutch"),
    ("PL", "Poland", r"poland|polish"),
    ("IE", "Ireland", r"ireland|irish"),
    ("GR", "Greece", r"greece|greek"),
    ("UA", "Ukraine", r"ukrain"),
    ("IL", "Israel", r"israel|shekel"),
    ("AE", "UAE", r"\buae\b|emirates|emirati|dubai|abu dhabi"),
    ("SA", "Saudi Arabia", r"saudi"),
    ("IR", "Iran", r"\biran"),
    ("TR", "Turkey", r"turkey|turkish|t\u00fcrkiye"),
    ("PK", "Pakistan", r"pakistan"),
    ("BD", "Bangladesh", r"bangladesh"),
    ("ID", "Indonesia", r"indonesia"),
    ("MY", "Malaysia", r"malaysia"),
    ("SG", "Singapore", r"singapore"),
    ("TH", "Thailand", r"thailand|thai\b"),
    ("VN", "Vietnam", r"vietnam"),
    ("PH", "Philippines", r"philippine|filipino"),
    ("HK", "Hong Kong", r"hong kong"),
    ("TW", "Taiwan", r"taiwan"),
    ("KZ", "Kazakhstan", r"kazakh"),
    ("KE", "Kenya", r"kenya"),
    ("ZA", "South Africa", r"south africa"),
    ("GH", "Ghana", r"ghana"),
    ("ET", "Ethiopia", r"ethiopia"),
    ("EG", "Egypt", r"egypt"),
    ("RW", "Rwanda", r"rwanda"),
    ("MX", "Mexico", r"mexico|mexican"),
    ("AR", "Argentina", r"argentin"),
    ("CO", "Colombia", r"colombia"),
    ("BO", "Bolivia", r"bolivia"),
    ("CL", "Chile", r"chile\b|chilean"),
    ("PE", "Peru", r"\bperu"),
    ("LK", "Sri Lanka", r"sri lanka"),
]


def mark_classify(low):
    tags = [k for k, rx in MARK_CATS if re.search(rx, low)]
    # Aadhaar crime stories (fake cards, frauds) are not rollout news
    if "id" in tags and "aadhaar" in low and re.search(r"fake|fraud|racket|scam|arrest|police|forg|court|\bhc\b|murder|stolen", low):
        tags.remove("id")
    return tags


def countries_of(title):
    low = title.lower()
    return [c for c, _, rx in COUNTRIES if re.search(rx, low)]


AC_URL = "https://www.atlanticcouncil.org/cbdctracker/"
AC_TIMELINE = "https://flo.uri.sh/visualisation/14215680/embed"


def cbdc_status(http_get, old, now_ts):
    """World CBDC status from the Atlantic Council tracker (public page), re-read once a day."""
    if old and now_ts - old.get("checked", 0) < 86400:
        return old
    out = dict(old or {})
    try:
        h = http_get(AC_URL, timeout=25).decode("utf8", "ignore")
        t = re.sub(r"<script.*?</script>|<style.*?</style>", "", h, flags=re.S)
        t = htmlmod.unescape(re.sub(r"<[^>]+>", "\n", t))
        lines = [l.strip() for l in t.splitlines() if l.strip()]
        up = next((l.split(":", 1)[1].strip() for l in lines if l.lower().startswith("last updated:")), "")
        kf = []
        if "Key findings" in lines:
            for l in lines[lines.index("Key findings") + 1:]:
                if l.startswith("Cross-border CBDC projects") or len(kf) >= 20:
                    break
                kf.append(l)
        heads = [kf[i] for i in range(0, len(kf), 2)]
        bodies = [kf[i] for i in range(1, len(kf), 2)]
        if kf:
            out.update({"updated": up, "findings": [{"h": a, "b": b} for a, b in zip(heads, bodies + [""] * len(heads))][:9]})
    except Exception as e:
        print("cbdc page error:", type(e).__name__, e)
    try:
        h = http_get(AC_TIMELINE, timeout=25).decode("utf8", "ignore")
        d = json.loads(re.search(r"_Flourish_data = (\{.*?\}),\n", h, re.S).group(1))
        c = json.loads(re.search(r"_Flourish_data_column_names = (\{.*?\}),\n", h, re.S).group(1))
        when = c["data"]["values"]
        out["timeline"] = {"when": when, "rows": [{"label": r["label"], "values": r["values"]} for r in d["data"]]}
    except Exception as e:
        print("cbdc timeline error:", type(e).__name__, e)
    if out.get("findings") or out.get("timeline"):
        out["checked"] = now_ts
        out["source"] = AC_URL
    return out


def mark(http_get, load_json, save_json, now_ts, central_time, merge):
    keep_h = 24 * 14
    urls = [_gnews(q, 7) for q in MARK_Q] + [_bingu(q) for q in MARK_BING]
    items, ok = _pull(urls, http_get)
    fresh = _dedupe(items, mark_classify, now_ts, keep_h)
    prev = load_json("beast.json", {})
    old = prev.get("stories", [])
    stories = merge(fresh, old, now_ts, keep_h, 220, "tags") if ok else old
    stories = [s for s in stories if mark_classify(s["title"].lower()) and not re.search(JUNK, s["title"].lower())]
    for s in stories:
        s["tags"] = mark_classify(s["title"].lower())
        s["cc"] = countries_of(s["title"])
    counts = {k: sum(1 for s in stories if k in s["tags"]) for k, _ in MARK_CATS}
    week = {k: sum(1 for s in stories if k in s["tags"] and now_ts - s["t"] < 7 * 86400) for k, _ in MARK_CATS}
    names = {c: n for c, n, _ in COUNTRIES}
    cmap = {}
    for s in stories:
        for c in s["cc"]:
            e = cmap.setdefault(c, {"cc": c, "name": names[c], "n": 0, "tags": {}, "last": 0})
            e["n"] += 1
            e["last"] = max(e["last"], s["t"])
            for k in s["tags"]:
                e["tags"][k] = e["tags"].get(k, 0) + 1
    clist = sorted(cmap.values(), key=lambda e: (-e["n"], -e["last"]))
    cb = cbdc_status(http_get, prev.get("cbdc"), now_ts)
    save_json("beast.json", {"updated": now_ts, "updated_ct": central_time(now_ts), "keep_hours": keep_h, "feeds_ok": ok,
                             "count": len(stories), "counts": counts, "week": week, "countries": clist, "cbdc": cb, "stories": stories})
    print(f"mark: {len(stories)} stories ({len(fresh)} fresh of {len(items)} raw) from {ok}/{len(urls)} feeds, {len(clist)} countries")


# ====================================================================== PEACE AND SAFETY
PEACE_Q = [
    '"peace and security" OR "peace and safety"',
    '"peace deal" OR "peace agreement" OR "peace treaty" OR "peace accord" OR "peace plan"',
    'ceasefire OR "cease-fire" OR truce OR armistice',
    'Israel normalization OR "Abraham Accords" OR "normalize ties"',
    'Israel covenant OR treaty OR "security pact" OR "defense pact" OR "non-aggression"',
    'Israel peace Saudi OR Lebanon OR Syria agreement',
]
PEACE_BING = ['"peace and security"', '"peace deal" Israel', "ceasefire Israel", '"Abraham Accords"']
ISRAEL = r"israel|israeli|netanyahu|jerusalem|gaza|hamas|hezbollah|west bank|palestin|\bidf\b|tel aviv"
P_PS = r"peace and (security|safety)|security and peace|safety and peace|peace,? (security|safety) and"
P_DEAL = (r"peace (deal|agreement|treaty|accord|plan|pact|framework|talks|summit|process|initiative|proposal|negotiation\w*|board|council|envoy)|"
          r"board of peace|peace-?making|make peace|brokered peace")
P_CEASE = r"cease-?fire|truce|armistice|cessation of hostilities|halt (to )?(the )?fighting"
P_NORM = r"normali[sz]\w*|abraham accords?|establish\w* (diplomatic )?(ties|relations)|diplomatic (ties|relations)"
P_COV = r"covenant|security pact|defen[cs]e pact|non-aggression|mutual defen[cs]e|seven-year|7-year (deal|agreement|pact|treaty)|\btreaty\b"
P_NOT = r"armistice day|veterans (day|for peace)|remembrance|christmas truce|trade truce|truce project|\b(tax treaty|plastics? treaty|pandemic (treaty|accord)|climate|trade deal|tariff|nfl|nba|labor union|union strike|strike ends|labor|labour|divorce|inner peace|rest in peace|peace of mind)\b"
P_LABEL = {"ps": "\u201cPeace and security\u201d", "deal": "Peace deal", "cease": "Ceasefire", "norm": "Normalization", "cov": "Covenant / pact"}


def peace_classify(low):
    if re.search(P_NOT, low):
        return []
    tags = []
    isr = re.search(ISRAEL + r"|saudi|gulf|arab|lebanon|syria", low)
    if re.search(P_PS, low):
        tags.append("ps")
    if re.search(P_DEAL, low):
        tags.append("deal")
    if re.search(P_CEASE, low):
        tags.append("cease")
    if re.search(P_NORM, low) and (isr or "abraham" in low):
        tags.append("norm")
    if re.search(P_COV, low) and (isr or re.search(r"peace|security|defen[cs]e", low)):
        tags.append("cov")
    if tags and re.search(ISRAEL, low):
        tags.append("il")
    return tags


SIGNED = r"\b(sign\w*|agree\w*|reach\w*|announc\w*|historic|seal\w*|finali[sz]\w*|clinch\w*|strikes?|struck|unveil\w*|inks?|inked|formali[sz]\w*|join\w*|confirm\w*)\b"
HEDGE = r"\b(?:no|not|won'?t|never|reject\w*|den(y|ies|ied)|collaps\w*|stall\w*|far from|unlikely|doubt\w*|could|may|might|would|if|hopes?|hoping|push\w* for|calls? for|urg\w*|warns?|threat\w*|talks? on|weighs?|considers?|eyes)\b|\?"


def is_major_israel_deal(s):
    low = s["title"].lower()
    t = s["tags"]
    if "il" not in t and not re.search(r"saudi|abraham accords?", low):
        return False
    if not ({"deal", "norm", "cov"} & set(t)):
        return False
    if "deal" in t and not re.search(r"peace (deal|agreement|treaty|accord|pact)", low) and not ({"norm", "cov"} & set(t)):
        return False
    return bool(re.search(SIGNED, low)) and not re.search(HEDGE, low)


def ct_day(ts):
    return datetime.fromtimestamp(ts, CENTRAL).strftime("%Y-%m-%d")


def peace(http_get, load_json, save_json, now_ts, central_time, merge, ntfy, trusted):
    keep_h = 24 * 7
    # counting uses the same kind of window every time: Google News, last 24 hours, the six peace searches
    g_items, ok = _pull([_gnews(q, 1) for q in PEACE_Q], http_get)
    b_items, _ = _pull([_bingu(q) for q in PEACE_BING], http_get)
    counted = _dedupe(g_items, peace_classify, now_ts, 24)
    fresh = _dedupe(g_items + b_items, peace_classify, now_ts, keep_h)
    prev = load_json("peace.json", {})
    if not ok:
        print("peace: no feeds answered, keeping last reading")
        return
    n24 = len(counted)
    il24 = sum(1 for s in counted if "il" in s["tags"])
    ps24 = sum(1 for s in counted if "ps" in s["tags"])
    today = ct_day(now_ts)
    hist = [h for h in prev.get("hist", []) if isinstance(h, dict) and h.get("d")][-45:]
    if len([h for h in hist if h["d"] != today]) < 3:
        # first runs: count each of the last 7 days the same way (one day per search), once
        days = [datetime.fromtimestamp(now_ts - 86400 * i, CENTRAL).date() for i in range(7, 0, -1)]
        seeded = {}
        for d in days:
            nd = datetime.fromordinal(d.toordinal() + 1).date()
            its, okd = _pull([_gnews(q, 1).replace("+when%3A1d", "+after%3A" + d.isoformat() + "+before%3A" + nd.isoformat()) for q in PEACE_Q], http_get)
            if okd:
                seeded[d.isoformat()] = len(_dedupe(its, peace_classify, now_ts, 24 * 10))
        have = {h["d"] for h in hist}
        hist = sorted(hist + [{"d": k, "n": v, "seed": 1} for k, v in seeded.items() if k not in have], key=lambda h: h["d"])
        print("peace: seeded usual-day counts", seeded)
    if hist and hist[-1]["d"] == today:
        hist[-1]["n"] = max(hist[-1]["n"], n24)
    else:
        hist.append({"d": today, "n": n24})
    past = [h["n"] for h in hist if h["d"] != today][-14:]
    base = max((sum(past) / len(past)) if past else (n24 or 1), 3)
    ratio = round(n24 / base, 2)
    level = "spike" if ratio >= 1.6 and n24 >= 10 else "rising" if ratio >= 1.25 else "calm"
    old = prev.get("stories", [])
    stories = merge(fresh, old, now_ts, keep_h, 120, "tags")
    stories = [s for s in stories if peace_classify(s["title"].lower())]
    for s in stories:
        s["tags"] = peace_classify(s["title"].lower())
        s["major"] = 1 if is_major_israel_deal(s) and trusted(s["src"]) else 0
    counts = {k: sum(1 for s in counted if k in s["tags"]) for k in ("ps", "deal", "cease", "norm", "cov")}
    out = {"updated": now_ts, "updated_ct": central_time(now_ts), "keep_hours": keep_h, "feeds_ok": ok,
           "n24": n24, "il24": il24, "ps24": ps24, "base": round(base, 1), "base_days": len(past),
           "ratio": ratio, "level": level, "counts": counts, "hist": hist,
           "count": len(stories), "stories": stories}
    save_json("peace.json", out)
    print(f"peace: {n24} in 24h (Israel {il24}) vs usual {base:.1f}/day -> x{ratio} {level}; {len(stories)} kept from {ok}/{len(PEACE_Q)} feeds")

    # phone: only a big spike or a major Israel peace / normalization / covenant deal (shares the 3-minute throttle)
    topic = os.environ.get("NTFY_TOPIC", "").strip()
    st = load_json("peace_state.json", {})
    sent = [i for i in st.get("sent", []) if isinstance(i, str)][:300]
    new = [s for s in stories if s.get("major") and s["id"] not in sent and now_ts - s["t"] < 12 * 3600
           and not any(mideast._same(s["title"], o) for o in st.get("sent_titles", []))]
    spike = level == "spike" and ratio >= 2.5 and n24 >= 20 and now_ts - st.get("last_spike", 0) > 12 * 3600
    ps = load_json("push_state.json", {})
    last_spike = st.get("last_spike", 0)
    if (new or spike) and topic and st.get("init"):
        if now_ts - ps.get("last_push", 0) < 180:
            print("peace push: waiting (one phone alert per 3 min)")
            new, spike = [], False
        else:
            try:
                if new:
                    s = new[0]
                    more = f"\n+{len(new) - 1} more in the app" if len(new) > 1 else ""
                    ntfy(topic, "\u262e\ufe0f\U0001F6A8 PEACE AND SAFETY \u00b7 ISRAEL DEAL", f"{s['title']}\n\u2014 {s['src']}{more}\n1 Thessalonians 5:3", 5, ["dove_of_peace", "rotating_light"], s["link"])
                else:
                    top = "\n".join(f"\u2022 {s['title']} ({s['src']})" for s in sorted(counted, key=lambda x: -x["t"])[:3])
                    ntfy(topic, f"\u262e\ufe0f PEACE AND SAFETY SPIKE \u00b7 {ratio}x the usual", f"{n24} peace headlines in 24 hours (usual {base:.0f} a day)\n{top}", 4, ["dove_of_peace"], APP)
                    last_spike = now_ts
                ps["last_push"] = now_ts
                save_json("push_state.json", ps)
                print(f"peace push: sent ({len(new)} deal, spike={spike})")
            except Exception as e:
                print("peace push error:", type(e).__name__, e)
                new = []
    elif new or spike:
        print(f"peace push: marked {len(new)} (first run or no topic)")
        if spike:
            last_spike = now_ts
    save_json("peace_state.json", {"init": 1 if topic else 0, "updated": now_ts, "last_spike": last_spike,
                                   "sent": [s["id"] for s in new] + sent,
                                   "sent_titles": ([s["title"] for s in new] + st.get("sent_titles", []))[:100]})


def run(http_get, load_json, save_json, now_ts, central_time, merge, ntfy, trusted):
    for name, fn in (("mark", lambda: mark(http_get, load_json, save_json, now_ts, central_time, merge)),
                     ("peace", lambda: peace(http_get, load_json, save_json, now_ts, central_time, merge, ntfy, trusted))):
        try:
            fn()
        except Exception as e:
            print(name, "error:", type(e).__name__, e)
