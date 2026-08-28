// efp-sync: receives progress/usage snapshots from the English-for-Parents
// PWA (public via the tailscale-funnel path /efp-sync/ingest) and serves a
// private stats dashboard for Alim on localhost/tailnet.
//
// Zero dependencies. Run: node efp-sync.mjs   (port 3468)
import http from "node:http";
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 3468;
const DATA = join(dirname(fileURLToPath(import.meta.url)), "data");
const PROFILES = ["mom", "dad"];
const MAX_BODY = 600 * 1024;
mkdirSync(DATA, { recursive: true });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function readBody(req, cb) {
  let size = 0;
  const chunks = [];
  req.on("data", (c) => {
    size += c.length;
    if (size > MAX_BODY) { req.destroy(); return; }
    chunks.push(c);
  });
  req.on("end", () => cb(Buffer.concat(chunks).toString("utf8")));
}

function latest(profile) {
  const f = join(DATA, `${profile}-latest.json`);
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, "utf8")); } catch { return null; }
}

function summarize() {
  const out = {};
  for (const p of PROFILES) {
    const snap = latest(p);
    if (!snap) { out[p] = null; continue; }
    const days = snap.usage?.days ?? {};
    const totalSec = Object.values(days).reduce((a, b) => a + b, 0);
    out[p] = {
      lastSeen: snap.receivedAt,
      sentAt: snap.sentAt,
      tz: snap.tz,
      streak: snap.progress?.streak ?? 0,
      totalXp: snap.progress?.totalXp ?? 0,
      xpToday: snap.progress?.xpToday ?? 0,
      lessonsDone: Object.keys(snap.progress?.lessons ?? {}).length,
      cardsSeen: Object.keys(snap.progress?.cards ?? {}).length,
      totalMinutes: Math.round(totalSec / 60),
      days,
      events: (snap.usage?.events ?? []).slice(-30).reverse(),
    };
  }
  return out;
}

const server = http.createServer((req, res) => {
  // Funnel may or may not strip the /efp-sync mount prefix — accept both.
  const path = new URL(req.url, "http://x").pathname.replace(/^\/efp-sync/, "") || "/";

  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }

  // The funnel mounts /efp-sync/ingest; depending on proxy behavior the
  // backend may see the full path or just "/". Any POST is an ingest.
  if (req.method === "POST" && (path === "/ingest" || path === "/")) {
    return readBody(req, (raw) => {
      let body;
      try { body = JSON.parse(raw); } catch { body = null; }
      if (!body || body.app !== "efp2" || !PROFILES.includes(body.profile)) {
        res.writeHead(400, cors); return res.end();
      }
      const rec = { receivedAt: new Date().toISOString(), ...body };
      appendFileSync(join(DATA, `${body.profile}.jsonl`), JSON.stringify(rec) + "\n");
      writeFileSync(join(DATA, `${body.profile}-latest.json`), JSON.stringify(rec, null, 1));
      res.writeHead(204, cors); res.end();
    });
  }

  if (req.method === "GET" && path === "/stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(summarize(), null, 1));
  }

  if (req.method === "GET" && (path === "/" || path === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(dashboardHtml());
  }

  res.writeHead(404, cors); res.end();
});

server.listen(PORT, () => console.log(`efp-sync on :${PORT}, data in ${DATA}`));

function dashboardHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>English for Parents — stats</title>
<style>
:root{--bg:#faf6ef;--card:#fff;--ink:#1f2937;--ink2:#6b7280;--muted:#9ca3af;
  --accent:#0f766e;--accent2:#4f46e5;--line:#e5e7eb;--barbg:#f1ede4}
@media (prefers-color-scheme: dark){:root{--bg:#111418;--card:#1a1f26;--ink:#e5e7eb;
  --ink2:#9ca3af;--muted:#6b7280;--accent:#2dd4bf;--accent2:#818cf8;--line:#2a3138;--barbg:#232a32}}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,system-ui,sans-serif;padding:24px}
h1{font-size:20px;margin-bottom:2px}
.sub{color:var(--ink2);margin-bottom:20px;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;max-width:980px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px}
.card h2{font-size:16px;margin-bottom:10px}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
.tile{border:1px solid var(--line);border-radius:8px;padding:8px 10px}
.tile .v{font-size:20px;font-weight:650;font-variant-numeric:tabular-nums}
.tile .l{font-size:11px;color:var(--ink2)}
.chart{display:flex;align-items:flex-end;gap:2px;height:72px;margin:6px 0 2px}
.bar{flex:1;background:var(--accent);border-radius:3px 3px 0 0;min-height:2px;position:relative}
.bar.dad{background:var(--accent2)}
.bar:hover::after{content:attr(data-tip);position:absolute;bottom:100%;left:50%;
  transform:translateX(-50%);background:var(--ink);color:var(--bg);font-size:11px;
  padding:2px 7px;border-radius:5px;white-space:nowrap;margin-bottom:4px;z-index:2}
.axis{display:flex;gap:2px;font-size:9.5px;color:var(--muted)}
.axis span{flex:1;text-align:center;overflow:hidden}
.last{color:var(--ink2);font-size:12px;margin-top:10px}
details{margin-top:10px;font-size:12.5px}summary{color:var(--ink2);cursor:pointer}
table{border-collapse:collapse;margin-top:6px;width:100%}
td,th{padding:2px 8px 2px 0;text-align:left;color:var(--ink2);font-weight:400}
th{color:var(--muted);font-size:11px}
td:first-child{color:var(--ink)}
.empty{color:var(--muted);font-style:italic}
</style></head><body>
<h1>English for Parents</h1><div class="sub">progress &amp; usage, synced from their phones</div>
<div class="grid" id="grid"></div>
<script>
const NAMES={mom:"مامان (Mom)",dad:"بابا (Dad)"};
function fmtMin(m){return m>=60?(m/60).toFixed(1)+" h":m+" min"}
function localKey(x){const p=n=>String(n).padStart(2,"0");return x.getFullYear()+"-"+p(x.getMonth()+1)+"-"+p(x.getDate())}
function lastNDays(n){const a=[];const d=new Date();for(let i=n-1;i>=0;i--){const x=new Date(d);x.setDate(d.getDate()-i);a.push(localKey(x))}return a}
fetch("stats").then(r=>r.json()).then(data=>{
  const grid=document.getElementById("grid");
  for(const p of ["mom","dad"]){
    const s=data[p];
    const card=document.createElement("div");card.className="card";
    if(!s){card.innerHTML="<h2>"+NAMES[p]+"</h2><div class='empty'>no data yet — hasn't opened the app</div>";grid.append(card);continue}
    const keys=lastNDays(14);
    const mins=keys.map(k=>Math.round((s.days[k]||0)/60));
    const max=Math.max(...mins,1);
    const bars=keys.map((k,i)=>"<div class='bar "+p+"' style='height:"+Math.max(2,Math.round(mins[i]/max*68))+"px' data-tip='"+k+": "+fmtMin(mins[i])+"'></div>").join("");
    const ax=keys.map(k=>"<span>"+k.slice(8)+"</span>").join("");
    const ev=(s.events||[]).slice(0,12).map(e=>"<tr><td>"+e.type+(e.detail?" · "+e.detail:"")+"</td><td>"+new Date(e.t).toLocaleString()+"</td></tr>").join("");
    card.innerHTML="<h2>"+NAMES[p]+"</h2>"
      +"<div class='tiles'>"
      +"<div class='tile'><div class='v'>"+fmtMin(s.totalMinutes)+"</div><div class='l'>total time</div></div>"
      +"<div class='tile'><div class='v'>"+s.streak+"</div><div class='l'>day streak</div></div>"
      +"<div class='tile'><div class='v'>"+s.lessonsDone+"</div><div class='l'>lessons done</div></div>"
      +"<div class='tile'><div class='v'>"+s.totalXp+"</div><div class='l'>total XP</div></div>"
      +"</div>"
      +"<div class='chart'>"+bars+"</div><div class='axis'>"+ax+"</div>"
      +"<div class='last'>last seen: "+new Date(s.lastSeen).toLocaleString()+" · words seen: "+s.cardsSeen+"</div>"
      +"<details><summary>recent activity</summary><table><tr><th>event</th><th>when</th></tr>"+(ev||"")+"</table></details>";
    grid.append(card);
  }
});
</script></body></html>`;
}
