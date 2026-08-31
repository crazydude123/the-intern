#!/usr/bin/env python3
"""THE INTERN — report renderer (runs inside the Solari sandbox).

Pure stdlib. Reads the recon JSON the browser swarm produced and renders a
single-file HTML report: inline SVG charts, inline CSS, no CDN, no fonts,
no dependencies — because the whole point is that a fresh microVM can render
it in about a second with nothing installed.

Usage: python3 report.py <recon.json> <out.html>
"""

import html
import json
import sys
from datetime import datetime, timezone


def esc(s) -> str:
    return html.escape(str(s), quote=True)


def shorten(s: str, n: int) -> str:
    s = " ".join(s.split())
    return s if len(s) <= n else s[: n - 1] + "…"


def bar_chart(rows, unit="chars", w=920):
    """Horizontal inline-SVG bar chart. rows = [(label, value, color)]."""
    row_h, pad_l, label_w = 46, 16, 300
    max_v = max((v for _, v, _ in rows), default=1) or 1
    h = pad_l * 2 + row_h * len(rows)
    out = [
        f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" '
        f'role="img" style="width:100%;height:auto">',
    ]
    for i, (label, value, color) in enumerate(rows):
        y = pad_l + i * row_h
        bw = max(6, int((w - label_w - 130) * (value / max_v)))
        out.append(
            f'<text x="{pad_l}" y="{y + 21}" fill="#8b95a7" '
            f'font-size="14" font-family="monospace">{esc(shorten(label, 42))}</text>'
        )
        out.append(
            f'<rect x="{label_w}" y="{y + 6}" width="{bw}" height="22" rx="5" '
            f'fill="{color}" opacity="0.9"><title>{esc(label)}: {value:,} {unit}</title></rect>'
        )
        out.append(
            f'<text x="{label_w + bw + 10}" y="{y + 22}" fill="#dfe6f2" '
            f'font-size="13" font-family="monospace">{value:,}</text>'
        )
    out.append("</svg>")
    return "".join(out)

CSS = """
:root { color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0e16; color: #dfe6f2; line-height: 1.6;
       font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
.wrap { max-width: 980px; margin: 0 auto; padding: 48px 28px 80px; }
.kicker { color: #7c5cff; font-family: monospace; font-size: 13px; letter-spacing: 2px; }
h1 { font-size: 44px; line-height: 1.1; margin: 10px 0 8px; letter-spacing: -1px; }
.sub { color: #8b95a7; font-size: 16px; max-width: 720px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 36px 0; }
.stat { background: #101726; border: 1px solid #1d2740; border-radius: 12px; padding: 16px 18px; overflow: hidden; }
.stat b { display: block; font-size: 26px; letter-spacing: -0.5px; overflow-wrap: anywhere; }
.stat span { color: #8b95a7; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
h2 { font-size: 20px; margin: 40px 0 14px; }
.panel { background: #101726; border: 1px solid #1d2740; border-radius: 14px; padding: 22px; }
.card { background: #101726; border: 1px solid #1d2740; border-radius: 14px; padding: 20px 22px; margin: 12px 0; }
.card h3 { font-size: 16px; margin-bottom: 2px; }
.card .url { color: #58a6ff; font-size: 13px; font-family: monospace; word-break: break-all; }
.card .meta { color: #8b95a7; font-size: 12px; font-family: monospace; margin: 6px 0 10px; }
.card p { color: #b7c1d4; font-size: 14px; }
.pill { display: inline-block; background: #12213a; color: #58a6ff; border-radius: 99px;
        padding: 1px 10px; font-size: 11px; font-family: monospace; margin-left: 8px; vertical-align: middle; }
.pill.bad { background: #3a1220; color: #ff6b8d; }
.pipeline { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.pipe { background: #101726; border: 1px solid #1d2740; border-radius: 14px; padding: 18px; }
.pipe b { color: #7c5cff; font-family: monospace; font-size: 13px; }
.pipe p { color: #b7c1d4; font-size: 13.5px; margin-top: 6px; }
footer { margin-top: 48px; border-top: 1px solid #1d2740; padding-top: 18px;
         color: #8b95a7; font-size: 13px; font-family: monospace; }
a { color: #58a6ff; }
.mode-dry .kicker::after { content: "  [DRY-RUN - SIMULATED RECON]"; color: #f0b429; }
"""


def egress_display(raw: str):
    """The recon egress field may be a raw ipify response like {"ip":"1.2.3.4"}.
    Show just the IP, and label it honestly: proxy egress only if we actually
    had a proxy (free plans run without one)."""
    s = (raw or "").strip()
    try:
        obj = json.loads(s)
        if isinstance(obj, dict) and "ip" in obj:
            return str(obj["ip"]), "egress ip"
    except (ValueError, TypeError):
        pass
    return s[:24] or "unknown", "proxy egress"


def build(recon: dict) -> str:
    mode = recon.get("mode", "live")
    sources = recon.get("sources", [])
    ok_sources = [s for s in sources if s.get("status") == "ok"]
    total_chars = sum(s.get("bytes", 0) for s in ok_sources)
    words = sum(len(s.get("excerpt", "").split()) for s in ok_sources)
    failed = len(sources) - len(ok_sources)
    elapsed = sum(s.get("elapsedMs", 0) for s in sources)
    goal = recon.get("goal", "no goal given")

    palette = ["#7c5cff", "#58a6ff", "#3fb98d", "#f0b429", "#ff6b8d", "#8b95a7"]
    chart_rows = [
        (s["label"], s.get("bytes", 0), palette[i % len(palette)])
        for i, s in enumerate(ok_sources)
    ]
    time_rows = [
        (s["label"], (s.get("elapsedMs", 0) // 1000) or 1, palette[i % len(palette)])
        for i, s in enumerate(ok_sources)
    ]

    cards = []
    for s in sources:
        status_pill = (
            '<span class="pill">ok</span>'
            if s.get("status") == "ok"
            else f'<span class="pill bad">{esc(s.get("error", "failed"))}</span>'
        )
        excerpt = esc(shorten(s.get("excerpt", ""), 420)) if s.get("status") == "ok" else "-"
        cards.append(f"""
      <div class="card">
        <h3>{esc(s["label"])}{status_pill}</h3>
        <div class="url">{esc(s["url"])}</div>
        <div class="meta">{esc(s.get("title", "untitled"))} · {s.get("bytes", 0):,} chars · {s.get("elapsedMs", 0):,} ms</div>
        <p>{excerpt}</p>
      </div>""")

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    egress_val, egress_label = egress_display(recon.get("egress", ""))
    return f"""<!doctype html>
<html lang="en" class="{'mode-dry' if mode == 'dry-run' else ''}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>THE INTERN · field report</title>
<style>{CSS}</style>
</head>
<body><div class="wrap">
  <div class="kicker">THE INTERN · FIELD REPORT · {esc(stamp)}</div>
  <h1>{esc(goal)}</h1>
  <p class="sub">Researched by a stealth cloud browser, computed by a sandbox microVM,
  and delivered from a cloud desktop. Three Solari machines did the work;
  this page is the deliverable.</p>

  <div class="stats">
    <div class="stat"><b>{len(sources)}</b><span>sources hit</span></div>
    <div class="stat"><b>{total_chars:,}</b><span>chars read</span></div>
    <div class="stat"><b>{words:,}</b><span>words captured</span></div>
    <div class="stat"><b>{elapsed / 1000:.1f}s</b><span>browse time</span></div>
    <div class="stat"><b style="font-family:monospace;font-size:17px">{esc(egress_val)}</b><span>{esc(egress_label)}</span></div>
  </div>

  <h2>Reading volume by source</h2>
  <div class="panel">{bar_chart(chart_rows)}</div>

  <h2>Time per source</h2>
  <div class="panel">{bar_chart(time_rows, unit="s")}</div>

  <h2>What the browser found <span class="pill{' bad' if failed else ''}">{failed} failed</span></h2>
  {''.join(cards) if cards else '<div class="card"><p>Nothing survived the recon run.</p></div>'}

  <h2>How this page was made</h2>
  <div class="pipeline">
    <div class="pipe"><b>01 · RECON</b><p>A stealth Solari browser with residential
      proxy egress visited every source, read the page, and screenshotted it.</p></div>
    <div class="pipe"><b>02 · FORGE</b><p>A Solari sandbox microVM booted in ~1s, took the
      recon JSON, and rendered this report with pure-stdlib Python. It is serving the
      page you are reading right now.</p></div>
    <div class="pipe"><b>03 · DELIVER</b><p>A Solari desktop opened a real Chrome on a real
      screen, navigated here, and screenshotted the result as proof of delivery.</p></div>
  </div>

  <footer>researched · computed · delivered by three microVMs — no human touched this page · mode={esc(mode)}</footer>
</div></body></html>
"""


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: report.py <recon.json> <out.html>", file=sys.stderr)
        sys.exit(2)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        recon = json.load(f)
    out = build(recon)
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(out)
    sources = recon.get("sources", [])
    words = sum(len(s.get("excerpt", "").split()) for s in sources)
    print(
        f"rendered {len(out):,} bytes · {len(sources)} sources · "
        f"{words:,} words · mode={recon.get('mode', 'live')}"
    )


if __name__ == "__main__":
    main()
