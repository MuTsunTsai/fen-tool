# FEN-Tool

This is a quick online tool for editing FEN (Forsyth-Edwards Notation) in chess,
specifically designed with the needs of the chess puzzle community in mind.

## 💡 How to use

For desktops, on the board on the right you can simply drag-and-drop piece from the template to arrange them,
and on the input boxes on the left you can manually input variations that are not available in the template.
For mobile devices, the two boards are one and you can enable manual input by double-tapping on the squares.
Options and tools should be mostly self-explanatory.

<br>

## ♟️ Notation

This tool supports all the [Fairy FEN](https://www.janko.at/Retros/d.htm) syntax (by Joost de Heer). A brief summary:

- Use `-` in front to denote neutral pieces (e.g. `-k`).
- Use `*` + number to denote rotation (e.g. `*2Q`). May be used together with neutral piece (e.g. `-*3b`).
- Use `'` + single char or `''`(that's two single-quote, not a double-quote) + double chars to denote text (e.g. `'A`, `''12`). May be used together with rotation (e.g. `*1'A`).\
  Note that you can even use emoji with this syntax (e.g. `'🦆` or `'👨‍👩‍👧‍👦`; composite emoji characters will be recognize as one).  \
  It is worth mentioning that, with the FFEN syntax, it is not possible to type the character `'` itself.\
  Tip: you can directly input text of 1 or 2 chars into a square, and it will be automatically converted to FFEN syntax if it doesn't match existing syntax.
- Four markers defined in FFEN can be used: `c` (circle), `x` (cross), `s` (square) and `t` (triangle).\
  Note that if "use S for knight" option is on, to avoid ambiguity, we will use `g` (from the German word "geviert") for the square marker instead.\
  We also support two additional markers: `a` (asterisk) and `d` (dame).
- Custom board dimension syntax is supported. For example, `4/4/4/4` represents an empty 4 x 4 board.

You can also put in the fairy notation used by [YACPDB](https://www.yacpdb.org/), for example `(!b2)` means the same as `-*2b`.

<br>

## 🛠️ Additional tools

### PDB

You can fetch a PDB problem by using its ID number,
or search for a problem using the position (fairy pieces are not supported in search).
It can also generate PDB board edit syntax (with fairy piece support)
that can be used when adding or editing a problem in PDB.

### YACPDB

This is similar to the PDB tool, with the addition of copying YACPDB style FEN.
Note that rotation is not supported in board edit syntax.

### BBS

This tool is for Taiwan BBS forums such as PTT, so it is shown only in Taiwan.
It generates colored BBS text (with traditional Chinese annotations)
that can be paste directly into posts.

### Play mode

This tool allows you to play on the setup board and record moves.
Only orthodox chess is supported.
There are three different modes:

1. Normal: can be used in direct mates and helpmate problems.
2. Allow passing moves: can be used in for example series helpmate problems.
3. Retro: playing backwards, used in retrograde analysis problems.

Tip: You can use left/right keys (or A/D keys) to quickly navigate move history.


<br>

## 🖼️ Sharing image

There are several ways you can share images generated by this tool:

- On mobile devices, you can use the `Share image` button to quickly share to other apps.\
  Note: Firefox Android does not support sharing image directly,
  and in that case it will fallback to sharing image URL instead.
- On desktops, you can copy the image using the `Copy image` button, and paste into other apps.
- You can also generate a URL that represents the image using `Create image URL` button.\
  This service is provided by [freeimage.host](https://freeimage.host/).


<br>

## 🖥️ API

To add generated images to your webpages, you can of course use the `Create image URL` button.
However, each image will contribute to extra download traffic when visitors visit your website,
giving them a slower browsing experience.
Besides, as the generated URLs are based on a third-party service,
there's no guarantee that those will last forever.

A more recommended approach is by using one of our APIs.
This tool uses service worker to cache all assets,
so once the user has loaded an instance, our APIs will run very fast,
and there won't be any additional traffic for the visitors.
Also, the generated diagram will be updated together with the tool,
should the tool made any improvements in the image quality.
We provide two different modes.

### Embed mode

If you just want to quickly add one or two images to your page, embed mode is for you.
You can use it by adding an `<iframe>` to your page like this:
```html
<iframe src="https://mutsuntsai.github.io/fen-tool/gen/?fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR" style="border:none;width:354px;height:354px"></iframe>
```
The code may be generated by the `Copy embed HTML code` button.

### SDK mode

If you need to add a lot of images to your site,
don't want to use `<iframe>` for whatever reasons,
or you might need to dynamically change the image,
the SDK mode is for you. To use it,
first add our SDK script to your webpage like this:

```html
<script src="https://mutsuntsai.github.io/fen-tool/sdk.js"
	data-size="26" data-set="alpha" data-bg="gray"></script>
```

This can be put anywhere, but preferably in the `<head>` part. 
The `data-` attributes in this example gives you an idea of how to assign global board options.
You don't need to worry about the details,
as our `Copy SDK script tag` button will help you generate it based on your settings
(except for board pattern and custom dimensions, which are not included for practical reasons).

Then all you have to do is something like this:

```html
<img fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR">
```

As long as `<img>` has the `fen` attribute on it, our SDK detects it and will automatically convert it to the actual image. You can also add `data-` attributes to the `<img>` to override global options, for example:

```html
<img fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
	data-size="32" data-pattern="inverted">
```

One cool thing about the SDK mode is that it allows you to control the image dynamically using JavaScript. For example:

```js
const img = document.getElementById("myImg");
img.setAttribute("fen", "8/8/8/8/8/8/8/8"); // Assign a new FEN
img.dataset.size = 38; // Change option
```

And the image will update automatically. You can also dynamically add or remove `<img>` elements, and it just works.

The internal mechanism used in our SDK is compatible with most front-end frameworks as well. For example, with [Vue.js](https://vuejs.org/) you can do this:

```html
<img v-if="shouldShowBoard" :fen="myFEN" :data-size="mySize">
```

<br>

## ⚜️ Chess set credits

- `1Echecs` is designed by Christian Poisson.
- `Alpha` is designed by Eric Bentzen.
- `Good Companion` is designed by David L. Brown.
- `Kilfiger` is designed by James Kilfiger [The Difficult Type](http://james.kilfiger.googlepages.com/).\
  The original font name is just "Chess". Slightly modified for this app.
- `Merida` is designed by Armando Hernandez Marroquin.
- [`MPChess`](https://github.com/chupinmaxime/mpchess) is designed by Maxime Chupin. Slightly modified for this app.
- [`Skak`](https://github.com/lehoff/skak) is designed by Piet Tutelaers and modified by Torben Hoffmann.