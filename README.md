> **License:** source-available, view and learn only. Not open source. See [LICENSE](LICENSE) before cloning, forking or using this code.

# Hand Fight

A wrestling game in the browser. Your sticks are your hands, your triggers are your hips, your bumpers grab wrists.

**Play:** [ag0nyy-ops.github.io/wrestle](https://ag0nyy-ops.github.io/wrestle/) · **Move index:** [all 139 moves](https://ag0nyy-ops.github.io/wrestle/moves.html)

## What's in it

- 139 entries in the move index: ties, shots, throws, counters, body lock slams, rides, turns, pins and escapes
- Body locks that put your back into an arch, then suplexes and slams off it
- A conditioning meter: nobody gets to go 100% for two whole minutes
- Four ways to lose: stepping out of the circle, two seconds on your back, a 15 point tech fall, or the clock
- Dummies rolled from a random seed (slammer, shooter, pusher, hand fighter, counter wrestler, all rounder), including dummy vs dummy
- A referee with a wristband on each arm who takes pins very personally
- Sound made in the browser, no audio files

## Controls

| Action | Controller | Keyboard |
| --- | --- | --- |
| Hands | Left stick (or D-pad) and right stick | WASD and IJKL |
| Hips | L2 / R2 | Q / O, plus Shift for all the way |
| Grab a wrist | L1 / R1 | E / U |
| Moves | Square / circle / triangle | 1 / 2 / 3 |
| Get up, break a lock | Mash cross | Mash Space |
| Walk, circle | Both hands the same way | |
| Shoot | Hips low, both hands forward | |

A controller or keyboard is needed to play. On a phone it opens on dummy vs dummy.

## Run locally

```sh
python3 -m http.server
```

Then open `http://localhost:8000`. Plain HTML, CSS and JavaScript on a 2D canvas. No framework, no build step, no dependencies, no third-party requests.

## Layout

| File | What it does |
| --- | --- |
| `js/moves.js` | every move in one table, read by both the game and the index |
| `js/game.js` | rules, input, dummies, referee |
| `js/render.js` | camera, arena, bodies, effects |
| `js/audio.js` | synthesized sound |
| `js/core.js` | vector math and shared constants |
| `js/index.js` | builds the move index |

## Third-party

IBM Plex Mono, IBM Plex Sans and UnifrakturMaguntia, under the SIL Open Font License 1.1. The licence texts sit next to the files in `assets/fonts/`.
