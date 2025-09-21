# MRV Order — From‑Scratch Redesign Plan (2025‑09‑15)

## Executive Summary
The current MRV panel shows “who is next” but not “how we got there” in a way that mirrors the solver. This plan redesigns the MRV Order to map 1:1 to the algorithm in `src/lib/sudoku/solver.ts` while keeping the default UI simple and the Expert view legible (no chip soup).

## Problems To Solve (observed)
1) Empties array not visualized clearly — hard to see frontier `k` and neighbors.
2) Scan selects a best index and swaps, but the best candidate’s coordinates are not explicitly shown during scan.
3) Picking order unclear — ambiguous labels (e.g., confusing `#51`) and no consistent notion of frontier vs. array index vs. step number.
4) Details/affordances need polish — too much noise in scan chips, inconsistent microcopy, unclear early‑stop.

## Design Goals
- Mirror the solver phases clearly: Scan → Select/Swap → Try/Place → Recurse/Backtrack.
- Make frontier `k` and the windowed “empties” visible and intuitive.
- Use clear, consistent labels: Frontier (F), Step (S), and coordinates (r,c).
- Default view stays board‑first; Expert adds compact internals (no chip clutter).

## Direct Mapping to `solver.ts`
- Phase A — Scan (selectMRV): iterate i = k..end, compute candidate counts, track best, early stop at 1.
- Phase B — Select + Swap: move best index to position k (or no swap).
- Phase C — Candidates for chosen cell: show candidates list (trial order).
- Phase D — DFS Try/Place/Backtrack: show progress through the chosen candidates and backtracking when needed.

## UI Structure and Behavior
– Next Pick (always visible)
  - Card: “Step S · Next pick (MRV)”
  - Shows: Frontier F = k+1, coordinates (r,c), candidate count badge (red 0 / green 1 / grey >1), and candidate digit chips in trial order.
  - Reason line: “Fewest legal candidates; ties broken row‑major.”

– Single MRV Scan List (replaces ribbon + groups)
  - A single, scrollable list representing `empties[k..end]`.
  - Each row: “(r,c) · m candidates”.
  - Visual states: processed (<k) dim, scanning i (soft yellow), best‑so‑far (green border), frontier k (blue border).
  - Early stop tag when m === 1.
  - After scan, animate or cue the swap best → k; list reflects post‑swap order.

- Expert: Scan + Swap (Phase A → B)
  - Scan strip aligned to the ribbon: a compact horizontal row showing counts for scanned indices (k..end), with a moving pointer and a “best so far ★” marker.
  - Early stop: inline “Early stop: single” text when a count of 1 is found.
  - Swap cue below: “swap: best j → k” or “no swap (best already at k)”.
  - Brief inline card for best index: “Best: (r,c), m candidates”.

- Expert: Try Queue (Phase D)
  - During tryDigit/place/backtrack, show a small vertical list of candidate digits for the current cell, with statuses: trying, placed, backtracked.
  - Tiny depth bar (depth ≈ k+1) to give call‑stack intuition without noise.

## Indexing and Terminology (to avoid “#51” confusion)
- Frontier (F): human position at the frontier (k+1). Primary label in UI.
- Array index (I): underlying index in `empties`; moved to tooltips only.
- Step (S): count of `selectCell` events; “Step 1” is the first selection.
- Always show 1‑based row/col coordinates.

## Interaction Details
- Click tile in the ribbon → board cell pulses (non‑stateful CSS pulse) and shows hover digits.
- Keyboard when panel focused: Up/Down to move focus within window; Enter to pulse/select on the board.
- Timeline sync: when scrubbing, panel reflects the snapshot’s phase (Scan/Swap for selectCell; Try Queue for try/place/backtrack).

## Implementation Steps (on `feat/mrv-order-redesign`)
1) MRV Scan List
   - Render `empties[k..]` with states (processed/scanning/best/frontier).
   - Drive scanning from `scan` and `scanPos`; show early stop; cue swap best → k.
2) Next Pick Card
   - Add Step S, frontier F, reason line; show candidate chips and color‑coded count badge.
3) Expert Scan + Swap
   - Keep a compact scan strip with pointer + best marker.
   - Consolidate narrative into one line: “Scanned N · min M · best (r,c) · swap best → k”.
4) Expert Try Queue
   - During try/place/backtrack events, show the queue of candidate digits with statuses, and a tiny depth bar.
5) Cleanup
   - Remove remaining references to old scan chip UI; keep `scan` and `swap` only for Expert summaries.
   - Ensure timeline snapshots render the correct phase view.

## Acceptance Criteria
- Users can answer “why this cell?” via the Next Pick card in < 2 seconds.
- Scan behavior (progress pointer + best so far + early stop) is understandable at a glance.
- Swap is explicit and easy to follow.
- Default mode: clean; Expert mode: compact internals with no visual clutter.

## Risks and Mitigations
- Power users may miss per‑index scan chips → Provide a concise Scan summary with pointer and best mark; document behavior.
- Over‑rendering the ribbon → Window and auto‑scroll; keep tiles lightweight.

## Out of Scope (for now)
- Advanced heuristics beyond MRV; focus on clarity, not new strategies.
- Changing solve order; align UI strictly to current `solver.ts` behavior.

## Checklist
- [ ] Frontier Ribbon implemented and synced with k
- [ ] Next Pick card with Step S, F, (r,c), candidates
- [ ] Expert Scan strip with pointer, best ★, early stop
- [ ] Swap cue and tiny best summary
- [ ] Expert Try Queue with statuses and depth bar
- [ ] Interactions: click, keyboard, timeline sync
- [ ] Cleanup old scan chip code and dead toggles
