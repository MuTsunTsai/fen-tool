let size = undefined;
let set = "1echecs";
let horMode = false;

const squares = new Array(64);

const CN = document.getElementById("CN");
const TP = document.getElementById('TP');
const CG = document.getElementById("CanvasGhost");
const TPG = document.getElementById("TemplateGhost");
const ctx = CN.getContext("2d");
const gCtx = CG.getContext("2d");
createSquares();

const fullWidthMap = (function() {
	const map = new Map();
	const FW1 = ("abcdefghijklmnopqrstuvwxyz"
		+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		+ ",./<>?;':\"[]\\{}|!@#$%^&*()_+-=`~").split("");
	const FW2 = ("ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
		+ "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"
		+ "，．／＜＞？；’：”〔〕＼｛｝｜！＠＃＄％︿＆＊（）ˍ＋－＝‘～").split("");
	for(let i = 0; i < FW1.length; i++) map.set(FW1[i], FW2[i]);
	return map;
})();

const us = unescape("%1B");
const A1 = "０１２３４５６７８９".split("");
const A2 = "黑白,ｐＰ ＝ 小兵,ｒＲ ＝ 城堡,ｎＮ ＝ 騎士,ｂＢ ＝ 主教,ｑＱ ＝ 皇后,ｋＫ ＝ 國王,".split(",");
const A3 = ",ｐ ＝ 小兵,ｒ ＝ 城堡,ｎ ＝ 騎士,ｂ ＝ 主教,ｑ ＝ 皇后,ｋ ＝ 國王,".split(",");

const FEN = document.getElementById("FEN");
const PDB = document.getElementById("PDB");

const img = new Image();

function load(s) {
	set = s;
	new Promise(resolve => {
		if(location.protocol == "https:") img.crossOrigin = "anonymous";
		else document.getElementById("B64").disabled = true;
		const t = document.getElementById("TemplateGhost");
		img.src = t.src = `assets/${set}${size}.png`;
		img.onload = resolve;
	}).then(() => {
		drawTemplate();
		draw();
	});
}

window.addEventListener("resize", () => setSize(size));

function setSize(s) {
	const newMode = document.body.clientWidth < 12 * s;
	if(newMode === horMode && s === size) return;
	horMode = newMode;
	size = s;
	const full = 8 * size + 2
	CG.width = CN.width = full;
	CG.height = CN.height = full;
	ctx.font = gCtx.font = `${size - 4}px arial`;
	if(horMode) {
		TPG.height = TP.height = 3 * size + 2;
		TPG.width = TP.width = full;
		CN.classList.add("mb-3");
		TP.classList.remove("ms-4");
	} else {
		TPG.width = TP.width = 3 * size + 2;
		TPG.height = TP.height = full;
		CN.classList.remove("mb-3");
		TP.classList.add("ms-4");
	}
	setSquareSize();
	load(set);
}

setSize(26);

const types = ["k", "q", "b", "n", "r", "p", "c", "x"];

function drawTemplate() {
	const tCtx = TP.getContext("2d");
	const gCtx = TPG.getContext("2d");
	let w = 3 * size + 2, h = 8 * size + 2;
	if(horMode) [w, h] = [h, w];
	tCtx.fillRect(0, 0, w, h);
	gCtx.clearRect(0, 0, w, h);
	for(let i = 0; i < 3; i++) {
		for(let j = 0; j < 8; j++) {
			const sx = (i + j) % 2 ? 0 : 3;
			tCtx.drawImage(img, (i + sx) * size, j * size, size, size,
				(horMode ? j : i) * size + 1, (horMode ? i : j) * size + 1, size, size);
			gCtx.drawImage(img, (i + 6) * size, j * size, size, size,
				(horMode ? j : i) * size, (horMode ? i : j) * size, size, size);
		}
	}
}

function draw() {
	const full = 8 * size + 2;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, full, full);
	if(!dragging) gCtx.clearRect(0, 0, full, full);
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const light = store.board.uncolored || store.board.inverted == Boolean((i + j) % 2);
			const value = squares[i * 8 + j].value;
			drawPiece(i, j, value, light) || drawBlank(i, j, light);
		}
	}
}

function drawPiece(i, j, value, light) {
	const neutral = value.startsWith("-") || value.startsWith("~");
	if(neutral) value = value.substring(1);

	let rotate = value.match(/^\*(\d)/)?.[1];
	if(rotate !== undefined) value = value.substring(2);
	rotate = Number(rotate) % 4;

	const lower = value.toLowerCase();
	const typeIndex = types.indexOf(lower);
	const isText = value.startsWith("'");
	if(typeIndex < 0 && !isText) return false;

	if(isText) drawBlank(i, j, light);
	bCtx.save();
	const sx = neutral ? 2 : value == lower ? 0 : 1;
	const bx = light ? 3 : 0;
	const [rx, ry] = [(rotate + 1 & 2) ? 1 : 0, rotate & 2 ? 1 : 0];
	bCtx.translate((j + rx) * size + 1, (i + ry) * size + 1);
	if(rotate !== 0) bCtx.rotate(Math.PI / 2 * rotate);
	if(isText) {
		const c = value.substring(1);
		const text = value.startsWith("''") ? value.substring(2) : fullWidth(c, false) || c;
		ctx.fillStyle = gCtx.fillStyle = "black";
		const measure = ctx.measureText(text);
		const height = measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent;
		const dx = Math.max((size - measure.width) / 2, 0);
		const dy = Math.max((size - height) / 2, 0);
		bCtx.fillText(text, dx, size - dy, size);
	} else {
		ctx.drawImage(img, (sx + bx) * size, typeIndex * size, size, size, 0, 0, size, size);
		gCtx.drawImage(img, (sx + 6) * size, typeIndex * size, size, size, 0, 0, size, size);
	}
	bCtx.restore();
	return true;
}

const bCtx = new Proxy({}, {
	get(target, name) {
		return function(...args) {
			ctx[name](...args);
			if(!dragging) gCtx[name](...args);
		};
	},
});

function drawBlank(i, j, light) {
	ctx.fillStyle = light ? "#FFCE9E" : "#D18B47";
	ctx.fillRect(j * size + 1, i * size + 1, size, size);
}

function rotate(d) {
	const temp = squares.map(s => s.value);
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const target = d == 1 ? (7 - j) * 8 + i : j * 8 + (7 - i);
			squares[i * 8 + j].value = temp[target];
		}
	}
	toFEN();
}

function color(c) {
	for(let i = 0; i < 64; i++) {
		let s = squares[i].value;
		if(s.substr(0, 1) == "'" || s == "") continue;
		if(s.substr(0, 1) == "-" || s.substr(0, 1) == "~") s = s.substr(1);
		s = s.toLowerCase();
		if(c == 0) s = "-" + s;
		if(c == 1) s = s.toUpperCase();
		squares[i].value = s;
	}
	toFEN();
}

function invertColor(l) {
	for(let i = 0; i < 64; i++) {
		let s = squares[i].value;
		if(s == "" || s.substr(0, 1) == "-") continue;
		if(!l && s.substr(0, 1) == "'") continue;
		t = s.toLowerCase();
		if(s == t) s = s.toUpperCase(); else s = t;
		squares[i].value = s;
	}
	toFEN();
}

function toBase64() {
	navigator.clipboard.writeText(CN.toDataURL());
}

function toFEN() {
	let i, j, s = 0, t = "";
	for(i = 0; i < 8; i++) {
		for(j = 0; j < 8; j++) {
			const index = i * 8 + j;
			if(s && squares[index].value != "") {
				t += s;
				s = 0;
			}
			if(squares[index].value == "") {
				s++;
				if(j == 7) {
					t += s;
					s = 0;
				}
			} else {
				t += squares[index].value;
			}
		}
		if(i < 7) t += "/";
	}
	FEN.value = t;
	draw();
}

function toSquares(check) {
	let cursor = 0, fen = [...FEN.value];
	function slice(n) {
		return fen.slice(cursor, cursor + n).join("");
	}
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const index = i * 8 + j;
			let char = fen[cursor] || "";
			if(char == "/") {
				cursor++;
				j--;
			} else if(char == "*") {
				squares[index].value = slice(3);
				cursor += 3;
			} else if(char == "-" || char == "~") {
				if(fen[cursor + 1] == "*") {
					squares[index].value = slice(4);
					cursor += 4;
				} else {
					squares[index].value = slice(2);
					cursor += 2;
				}
			} else if(char == "'") {
				if(fen[cursor + 1] == "'") {
					squares[index].value = slice(4);
					cursor += 4;
				} else {
					squares[index].value = slice(2);
					cursor += 2;
				}
			} else if(char.match(/\d/)) {
				let n = Number(char);
				for(let k = 0; k < n; k++) {
					if(k) {
						j++;
						if(j == 8) {
							i++;
							j = 0;
						}
					}
					squares[i * 8 + j].value = "";
				} cursor++;
			} else {
				squares[index].value = char.match(test) ? char : "";
				cursor++;
			}
		}
	}
	if(check) toFEN();
	else draw();
}

function squareOnFocus() { this.select(); }

function createSquares() {
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const index = i * 8 + j;
			squares[index] = document.createElement("input");
			squares[index].type = "text";
			squares[index].onchange = checkInput;
			squares[index].onfocus = squareOnFocus;
			squares[index].style.background = (i + j) % 2 ? "#D18B47" : "#FFCE9E";
			squares[index].classList.add("square");
			S.appendChild(squares[index]);
		}
	}
}

function setSquareSize() {
	const container = document.getElementById("S");
	const full = size * 8 + 2;
	container.style.width = full + "px";
	container.style.height = full + "px";
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const s = squares[i * 8 + j];
			s.style.top = i * size + "px";
			s.style.left = j * size + "px";
			s.style.width = size + "px";
			s.style.height = size + "px";
			s.style.lineHeight = (size - 2) + "px";
			s.style.fontSize = (size - 10) + "px";
		}
	}
}

const test = /^(-?(\*\d)?[kqbnrpcx]|'.|''..)$/iu;

function checkInput() {
	if(!this.value.match(test)) this.value = "";
	if(this.value.startsWith("-")) this.value = this.value.toLowerCase();
	toFEN();
}

async function getPDB_FEN() {
	const url = `https://pdb.dieschwalbe.de/search.jsp?expression=PROBID%3D%3D%27${PDB.value}%27`;
	const response = await fetch("https://corsproxy.io/?" + encodeURIComponent(url));
	const text = await response.text();
	FEN.value = text.match(/<b>FEN:<\/b> (.+)/)[1];
	toSquares(true);
}

function generateBBS() {
	let fen = [...FEN.value.replace(/\//g, "")];
	let result = "";
	let char;
	let cursor = 0;

	function ignoreRotation() { // 忽略旋轉
		if(char == "*") {
			cursor += 2;
			char = fen[cursor];
		}
	}

	for(let i = 0; i < 8; i++) {
		if(store.BBS.coordinates) result += us + "[m" + A1[8 - i] + "　";
		for(let j = 0; j < 8; j++) {
			char = fen[cursor];
			ignoreRotation();
			if(char == "~") {
				cursor++;
				char = fen[cursor];
			}
			if(char == "-") {
				cursor++;
				char = fen[cursor];
				ignoreRotation();
				result += us + "[0;37;" + BackgroundColor(i, j) + fullWidth(char, true);
			} else if(char == "'") {
				result += us + "[0;30;";
				result += BackgroundColor(i, j);
				if(fen[cursor + 1] == "'") {
					result += fen.slice(cursor + 2, cursor + 4).join("");
					cursor += 3;
				} else {
					if(fen[cursor + 1].match(/\d/)) {
						result += A1[Number(fen[cursor + 1])];
					} else {
						result += fullWidth(fen[cursor + 1], false);
					}
					cursor++;
				}
			} else if(char.match(/\d/)) {
				let n = Number(char);
				for(let k = 0; k < n; k++) {
					if(k) {
						j++;
						if(j == 8) {
							i++;
							j = 0;
						}
					}
					result += us + "[0;30;";
					result += BackgroundColor(i, j);
					result += "　";
				}
			} else {
				result += us + "[";
				if(store.BBS.redBlue) {
					if(char == char.toUpperCase()) result += "1;31;";
					else result += "1;34;";
					result += BackgroundColor(i, j) + fullWidth(char.toLowerCase(), true);
				} else {
					if(char == char.toUpperCase()) result += "1;37;";
					else result += "0;30;";
					result += BackgroundColor(i, j) + fullWidth(char, true);
				}
			}
			cursor++;
		}
		if(store.BBS.notes) result += us + "[m　　" + (store.BBS.uncoloredNotes ? A3[i] : A2[i]);
		if(i < 7) result += "\r\n";
	}
	result += us + "[m\r\n";
	if(store.BBS.PDB) result += us + "[0;30;40m" + PDB.value + us + "[m";
	if(store.BBS.coordinates) result += "\r\n　　ａｂｃｄｅｆｇｈ\r\n"
	result += us + "[0;30;40m" + FEN.value + us + "[m\r\n";
	navigator.clipboard.writeText(result);
}

function BackgroundColor(i, j) {
	if(store.board.uncolored) return "43;m";
	else return (i + j) % 2 ? "42;m" : "43;m";
}

function fullWidth(s, t) {
	if(t && s.toLowerCase() == "c") return "‧";
	if(t && s.toLowerCase() == "x") return "╳";
	return fullWidthMap.get(s);
}

CN.onmousedown = dragStart;
CN.ontouchstart = dragStart;
TP.onmousedown = dragStart;
TP.ontouchstart = dragStart;

const TPv = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");
let startX, startY, sqX, sqY, sq;
let ghost, draggingValue, offset;
let dragging = false;

document.body.onmousemove = mousemove;
document.body.ontouchmove = mousemove;
document.body.onmouseup = mouseup;
document.body.ontouchend = mouseup;

function mousemove(event) {
	if(dragging) dragMove(event);
}
function mouseup(event) {
	if(!dragging) return;
	wrapEvent(event);
	dragging = false;
	const r = CN.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - 1) / size);
	const x = Math.floor((event.clientX - r.left - 1) / size);
	const nsq = y * 8 + x;
	ghost.style.display = "none";
	if(y > -1 && y < 8 && x > -1 && x < 8) {
		const updated = squares[nsq].value !== draggingValue;
		squares[nsq].value = draggingValue;
		if(updated) toFEN();
	}
}

function dragStart(event) {
	event.preventDefault();
	if(event.button != 0 && !event.targetTouches) return;
	wrapEvent(event);

	const isCN = this == CN;
	startX = event.offsetX;
	startY = event.offsetY;
	sqX = Math.floor((startX - 1) / size);
	sqY = Math.floor((startY - 1) / size);
	sq = sqY * (isCN ? 8 : 3) + sqX;
	ghost = document.getElementById(isCN ? "CanvasGhost" : "TemplateGhost");
	if(!isCN || squares[sq].value != "") {
		dragging = true;
		ghost.style.clip = `rect(${2 + sqY * size}px,${(sqX + 1) * size}px,${(sqY + 1) * size}px,${2 + sqX * size}px)`;
		ghost.style.display = "block";
		offset = isCN ? 0 : 1;
		if(isCN) {
			const index = sqY * 8 + sqX;
			draggingValue = squares[index].value
			squares[index].value = "";
			toFEN();
		} else {
			draggingValue = horMode ? TPv[sqX * 3 + sqY] : TPv[sqY * 3 + sqX];
		}
		dragMove(event);
	}
}

function dragMove(event) {
	wrapEvent(event);
	const r = CN.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - 1) / size);
	const x = Math.floor((event.clientX - r.left - 1) / size);
	const { scrollLeft, scrollTop } = document.documentElement;
	if(y > -1 && y < 8 && x > -1 && x < 8) {
		ghost.style.left = r.left + (x - sqX) * size + offset + scrollLeft + "px";
		ghost.style.top = r.top + (y - sqY) * size + offset + scrollTop + "px";
	} else {
		ghost.style.left = event.clientX + scrollLeft - startX + "px";
		ghost.style.top = event.clientY + scrollTop - startY + "px";
	}
}

function wrapEvent(event) {
	if(event.targetTouches) {
		const bcr = event.target.getBoundingClientRect();
		const touch = event.targetTouches[0] || event.changedTouches[0];
		event.clientX = touch.clientX;
		event.clientY = touch.clientY;
		event.offsetX = event.clientX - bcr.x;
		event.offsetY = event.clientY - bcr.y;
	}
}

//===========================================================
// petite-vue
//===========================================================

const { createApp, reactive } = PetiteVue;

const store = reactive({
	BBS: {
		PDB: true,
		coordinates: true,
		notes: true,
		uncoloredNotes: false,
		redBlue: false,
	},
	board: {
		uncolored: false,
		inverted: false,
	},
	tab: 0,
});

let checkboxId = 0;
function Checkbox(key, label, onchange) {
	const path = key.split(".");
	key = path.pop();
	let target = store;
	while(path.length) target = target[path.shift()];
	return {
		$template: "#checkbox",
		id: "chk" + checkboxId++,
		label,
		checked: () => target[key],
		change: () => {
			target[key] = !target[key];
			onchange?.();
		},
	};
}

createApp({
	Checkbox,
	draw,
	store,
}).mount();
