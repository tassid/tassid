# ascii.rest pieces

Copied from https://github.com/bas3line/ascii at commit
`fcb644403bfc25af0002e415d1006dd10b99ca34`. MIT licensed, see `LICENSE`.
By @bas3line. Site: https://ascii.rest

Changes from upstream:

- the `.ts` extension was removed from relative imports;
- in `pieces/black-hole.ts`, `LOOP` went from 60 to 20 and `SPIN` from 7 to 3,
  so the disk closes its loop in few enough frames to fit in an svg.
