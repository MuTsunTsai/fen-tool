# FEN-Tool

This is a quick online tool for editing FEN (Forsyth-Edwards Notation) in chess, specifically designed with the needs of the chess puzzle community in mind.

## How to use

For desktops, on the board on the right you can simply drag-and-drop piece from the template to arrange them, and on the input boxes on the left you can manually input variations that are not available in the template. For mobile devices, the two boards are one and you can enable manual input by double-tapping on the squares. Options and tools should be mostly self-explanatory (the BBS tool is for Taiwan BBS forums such as PTT).

This tool is purely front-end by design, so it cannot generate a URL that represents an image like some other FEN tools. You can, however, easily share generated images by using the share button (works best on mobile devices) or by simply copy-and-paste the image.

## Notation

This tool supports most of the [Fairy FEN](https://www.janko.at/Retros/d.htm) syntax (by Joost de Heer). A brief summary:

- Use `-` in front to denote neutral pieces (e.g. `-k`).
- Use `*` + number to denote rotation (e.g. `*2Q`). May be used together with neutral piece (e.g. `-*3b`).
- Use `'` + single char or `''`(that's two single-quote, not a double-quote) + double chars to denote text (e.g. `'A`, `''12`). Note that you can even use emoji with this syntax (e.g. `'🦆`; note that some emojis are actually two chars, e.g. `''🎅🏻`).  May be used together with rotation (e.g. `*1'A`).
- Two markers can be used: `c` (circle) and `x` (cross). The square and triangle markers in FFEN are not supported here.

## Chess set credits

- `1Echecs` is designed by Christian Poisson.
- `Alpha` is designed by Eric Bentzen.
- `Good Companion` is designed by David L. Brown.
- `Merida` is designed by Armando Hernandez Marroquin.
- `Skak` is designed by Piet Tutelaers and modified by Torben Hoffmann.