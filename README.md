# FEN-Tool

This is a quick online tool for editing FEN (Forsyth-Edwards Notation) in Chess.

## Notation

This tool supports most of the fairy FEN syntax. A brief summary:

- Use `-` in front to denote neutral pieces (e.g. `-k`).
- Use `*` + number to denote rotation (e.g. `*2Q`). May be used together with neutral piece (e.g. `-*3b`).
- Use `'` + single char or `''`(that's two single-quote, not a double-quote) + double chars to denote text (e.g. `'A`, `''12`). Note that you can even use emoji with this syntax (e.g. `'🦆`; note that some emojis are actually two chars, e.g. `''🎅🏻`).

## Chess set credits

- `1Echecs` is designed by Christian Poisson.
- `Good Companion` is designed by David L. Brown.
- `Merida` is designed by Armando Hernandez Marroquin.
- `Skak` is designed by Piet Tutelaers and modified by Torben Hoffmann.