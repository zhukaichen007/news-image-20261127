// WORLD NEWS — 27 NOVEMBER 2026 (Friday)
// Draws a 1024x1024 PNG newspaper front page summarising the day's news.
// Node stdlib only. No network. Deterministic: same bytes every run.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- font ----
// A small 5x7 bitmap font, drawn from rows of "#" (on) and "." (off).
// All text in the image is set in capitals so only one case is needed.
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "01100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "01100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
};

// ------------------------------------------------------------- canvas ----
const W = 1024;
const H = 1024;
const px = new Uint8Array(W * H * 3); // RGB, row-major

type RGB = [number, number, number];

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
    }
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let yy = cy - r; yy <= cy + r; yy++) {
    for (let xx = cx - r; xx <= cx + r; xx++) {
      const dx = xx - cx;
      const dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) {
        if (xx >= 0 && xx < W && yy >= 0 && yy < H) {
          const i = (yy * W + xx) * 3;
          px[i] = c[0];
          px[i + 1] = c[1];
          px[i + 2] = c[2];
        }
      }
    }
  }
}

function textWidth(s: string, scale: number): number {
  // 5 px glyph + 1 px gap, scaled.
  return s.length * 6 * scale - scale;
}

function drawText(x: number, y: number, s: string, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS["?"];
    for (let row = 0; row < 7; row++) {
      const bits = g[row];
      for (let col = 0; col < 5; col++) {
        if (bits[col] === "1") {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentred(cx: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}

// Word-wrap a string to lines that fit maxWidth at the given scale.
function wrap(s: string, scale: number, maxWidth: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const trial = line ? line + " " + w : w;
    if (textWidth(trial, scale) <= maxWidth) {
      line = trial;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ------------------------------------------------------------ colours ----
const PAPER: RGB = [247, 243, 234];
const INK: RGB = [18, 32, 56];
const NAVY: RGB = [16, 38, 74];
const RED: RGB = [178, 34, 34];
const WHITE: RGB = [255, 255, 255];
const CARD: RGB = [255, 255, 255];
const BORDER: RGB = [200, 192, 176];
const GREY: RGB = [90, 92, 96];
const ACCENTS: RGB[] = [
  [178, 34, 34], // red
  [16, 38, 74], // navy
  [34, 110, 72], // green
  [150, 84, 8], // ochre
  [96, 44, 120], // purple
];

// -------------------------------------------------------------- news -----
// Ten stories of Friday 27 November 2026, each first reported that day.
interface Story {
  tag: string;
  head: string;
  sub: string;
}

const STORIES: Story[] = [
  {
    tag: "USA",
    head: "THANKSGIVING STORM HITS US EAST COAST",
    sub: "400 flights cancelled; 724,000 homes lose power.",
  },
  {
    tag: "UKRAINE",
    head: "TRUMP TELLS PUTIN TO PULL BACK",
    sub: "US president says he urged Russia to pull back in Europe.",
  },
  {
    tag: "UKRAINE",
    head: "ZELENSKY WARNS OF NEW RUSSIAN MASS STRIKE",
    sub: "Kyiv says Moscow is preparing a major attack in the coming days.",
  },
  {
    tag: "UKRAINE",
    head: "RUSSIAN STRIKES KILL 5, CUT POWER",
    sub: "Overnight attacks hit cities and knock out electricity supplies.",
  },
  {
    tag: "MIDDLE EAST",
    head: "2 ITALIANS KILLED IN KUWAIT DRONE STRIKE",
    sub: "Iran denies responsibility as Gulf tensions rise.",
  },
  {
    tag: "MIDDLE EAST",
    head: "BLASTS HIT 3 TANKERS IN HORMUZ STRAIT",
    sub: "Brent oil jumps toward $97 as Gulf shipping is shaken.",
  },
  {
    tag: "NORTH KOREA",
    head: "KIM ORDERS NUCLEAR PROGRAMME EXPANSION",
    sub: "North Korean leader calls for a bigger nuclear arsenal.",
  },
  {
    tag: "BRITAIN",
    head: "UK NET MIGRATION FALLS TO 30-YEAR LOW",
    sub: "Sharpest drop in net migration in almost three decades.",
  },
  {
    tag: "EUROPE",
    head: "EU SPLIT OVER BUDGET AND UKRAINE LOAN",
    sub: "Leaders divided on spending and a $49bn loan for Kyiv.",
  },
  {
    tag: "INDIA",
    head: "DELHI POLICE FREE 164 IN CYBER-SLAVERY RAID",
    sub: "Foreigners rescued from a racket run from the capital.",
  },
];

// ------------------------------------------------------------- layout ----
function draw(): void {
  fillRect(0, 0, W, H, PAPER);

  // Header band.
  fillRect(0, 0, W, 148, NAVY);
  fillRect(0, 148, W, 6, RED);
  drawTextCentred(W / 2, 22, "WORLD NEWS", 8, WHITE);
  drawTextCentred(W / 2, 96, "FRIDAY, 27 NOVEMBER 2026", 4, [214, 220, 232]);

  // Story cards: 2 columns x 5 rows.
  const margin = 22;
  const gap = 16;
  const cardW = Math.floor((W - margin * 2 - gap) / 2);
  const top = 172;
  const bottom = 968;
  const rows = 5;
  const cardH = Math.floor((bottom - top - (rows - 1) * 12) / rows);

  STORIES.forEach((story, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (cardW + gap);
    const y = top + row * (cardH + 12);
    const accent = ACCENTS[i % ACCENTS.length];

    fillRect(x, y, cardW, cardH, CARD);
    fillRect(x, y, cardW, 5, accent);
    // Border.
    fillRect(x, y, cardW, 1, BORDER);
    fillRect(x, y + cardH - 1, cardW, 1, BORDER);
    fillRect(x, y, 1, cardH, BORDER);
    fillRect(x + cardW - 1, y, 1, cardH, BORDER);

    // Number badge.
    const bx = x + 34;
    const by = y + 36;
    fillCircle(bx, by, 24, accent);
    const num = String(i + 1);
    drawTextCentred(bx, by - 14, num, 4, WHITE);

    // Region tag.
    drawText(x + 68, y + 22, story.tag, 2, accent);

    // Headline, up to 2 lines.
    const headLines = wrap(story.head, 3, cardW - 68 - 16).slice(0, 2);
    headLines.forEach((line, li) => {
      drawText(x + 68, y + 44 + li * 26, line, 3, INK);
    });

    // Sub-line, up to 2 lines.
    const subLines = wrap(story.sub, 2, cardW - 68 - 16).slice(0, 2);
    subLines.forEach((line, li) => {
      drawText(x + 68, y + 44 + 2 * 26 + 8 + li * 18, line, 2, GREY);
    });
  });

  // Footer.
  fillRect(0, 984, W, 2, BORDER);
  drawTextCentred(W / 2, 1000, "THE WORLD IN ONE DAY  -  27 NOVEMBER 2026", 2, GREY);
}

// ----------------------------------------------------------- PNG out -----
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePng(): Buffer {
  // RGB, filter 0 per scanline.
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------- main -----
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
draw();
const png = encodePng();
writeFileSync(join(outDir, "entry.png"), png);
