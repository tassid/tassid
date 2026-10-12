// Renders the ascii pieces to animated svgs for the profile readme.
// GitHub runs no script in a readme, so every frame is drawn ahead of time
// and css inside the svg shows them one after another.
//
//   node scripts/build-hero.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import blackHole, { meta as hole } from "./vendor/pieces/black-hole.ts";
import scramble, { meta as name } from "./vendor/pieces/scramble.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const PHRASES = ["tassiane anzolin", "machine learning", "software engineering"];
const PROMPT = "~/tassiane $ ls";

const CW = 10, LH = 20; // one cell, in svg units
const FONT = CW / 0.6; // a monospace advance is 0.6 em, give or take
const PAD = 4;
const HOLE_FPS = 8, HOLE_LOOP = 20; // LOOP in the vendored black-hole.ts
const NAME_FPS = 15;

const themes = {
  dark: { ink: "#d8d6cf", dim: "#8a8780" },
  light: { ink: "#15140f", dim: "#6b6860" },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// One <text> per frame, one <tspan> per row that has something in it.
function frameText(lines, top, cls, delay) {
  let spans = "", last = -1;
  lines.forEach((line, r) => {
    const row = line.trimEnd();
    if (!row) return;
    const at = last < 0 ? `y="${top + (r + 1) * LH - 5}"` : `dy="${(r - last) * LH}"`;
    spans += `<tspan x="${PAD}" ${at}>${esc(row)}</tspan>`;
    last = r;
  });
  return `<text class="${cls}" style="animation-delay:${+delay.toFixed(4)}s">${spans}</text>`;
}

function holeFrames(top) {
  const frame = blackHole();
  const n = HOLE_FPS * HOLE_LOOP;
  let out = "";
  for (let i = 0; i < n; i++) out += frameText(frame(i / HOLE_FPS).split("\n"), top, "h", i / HOLE_FPS) + "\n";
  return { out, n, seconds: HOLE_LOOP };
}

// The phrases are padded to one width so the piece centres them all at the
// same column; that column is then pulled back to the left edge.
function nameFrames(top) {
  const longest = Math.max(...PHRASES.map((p) => p.length));
  const indent = Math.floor((name.cols - longest) / 2);
  const frame = scramble({ phrases: PHRASES.map((p) => p.padEnd(longest)) });

  // The piece does not say how long its loop is: step until frame 0 comes round.
  const row = (i) => frame(i / NAME_FPS).split("\n")[name.rows >> 1].slice(indent);
  const first = row(0);
  let n = NAME_FPS * 4;
  while (row(n) !== first || row(n + 1) !== row(1) || row(n + 2) !== row(2)) n++;

  let out = "";
  for (let i = 0; i < n; i++) out += frameText([row(i)], top, "n", i / NAME_FPS) + "\n";
  return { out, n, seconds: n / NAME_FPS };
}

function svg({ ink, dim }) {
  const holeTop = 2 * LH;
  const nameTop = holeTop + (hole.rows + 1) * LH;
  const width = hole.cols * CW + 2 * PAD;
  const height = nameTop + 2 * LH;
  const h = holeFrames(holeTop);
  const n = nameFrames(nameTop);
  const slot = (count) => +(100 / count).toFixed(5);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="a black hole, its disk turning. tassiane anzolin: machine learning, software engineering.">
<style>
text{font:${+FONT.toFixed(2)}px ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,"DejaVu Sans Mono","Liberation Mono",monospace;white-space:pre;fill:${ink}}
.p{fill:${dim}}
.h,.n{opacity:0;animation:step-end infinite}
.h{animation-name:h;animation-duration:${h.seconds}s}
.n{animation-name:n;animation-duration:${+n.seconds.toFixed(4)}s}
@keyframes h{0%{opacity:1}${slot(h.n)}%{opacity:0}}
@keyframes n{0%{opacity:1}${slot(n.n)}%{opacity:0}}
@media (prefers-reduced-motion:reduce){.h,.n{animation:none}.h:first-of-type,.n:first-of-type{opacity:1}}
</style>
<text class="p" xml:space="preserve" x="${PAD}" y="${LH - 5}">${esc(PROMPT)}</text>
<g xml:space="preserve">
${h.out}</g>
<g xml:space="preserve">
${n.out}</g>
</svg>
`;
}

mkdirSync(join(root, "assets"), { recursive: true });
for (const [theme, colors] of Object.entries(themes)) {
  const file = join(root, "assets", `hero-${theme}.svg`);
  const text = svg(colors);
  writeFileSync(file, text);
  console.log(`${file}  ${(text.length / 1024).toFixed(0)} kB`);
}
