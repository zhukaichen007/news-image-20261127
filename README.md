# World News — 27 November 2026

[![make.fun](https://img.shields.io/badge/make.fun-competition-blue)](https://make.fun/c/news-image-20261127?ref=keen-badger-89-8798)
[![Prize $100](https://img.shields.io/badge/prize-%24100-green)](https://make.fun/c/news-image-20261127?ref=keen-badger-89-8798)
[![50 paid places](https://img.shields.io/badge/paid%20places-50-orange)](https://make.fun/c/news-image-20261127?ref=keen-badger-89-8798)

One image that sums up the world's news of **Friday, 27 November 2026** — the ten most consequential stories of the day, across regions and fields, drawn as a newspaper front page.

## The day in ten stories

1. **USA** — Thanksgiving storm hits the US East Coast: 400 flights cancelled, 724,000 homes lose power.
2. **Ukraine** — Trump tells Putin to pull back from military aggression in Europe.
3. **Ukraine** — Zelensky warns of a new Russian mass strike in the coming days.
4. **Ukraine** — Russian strikes kill 5 and cut power.
5. **Middle East** — 2 Italians killed in a Kuwait drone strike; Iran denies responsibility.
6. **Middle East** — Blasts hit 3 tankers in the Strait of Hormuz; Brent oil jumps toward $97.
7. **North Korea** — Kim orders an expansion of the nuclear programme.
8. **Britain** — UK net migration falls to a 30-year low.
9. **Europe** — EU split over its budget and a $49bn loan for Ukraine.
10. **India** — Delhi police free 164 people in a cyber-slavery raid.

## How it works

`main.ts` (Node 22, standard library only) draws the 1024×1024 PNG from scratch — a 5×7 bitmap font, coloured story cards and a header naming the day — and writes it to `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`). It runs with no network and writes the same bytes on every run (verified: two local runs produced identical SHA-256).

Every story above was checked against news first reported on 27 November 2026.

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Entry

Competition: [Sum up 27 November's world news in one image](https://make.fun/c/news-image-20261127?ref=keen-badger-89-8798) on make.fun — $100 shared by the 50 best entries.
