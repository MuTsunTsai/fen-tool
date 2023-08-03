import { parseSquare } from "../fen.mjs";

export const SQ = `[a-h][1-8]`;
export const P = `(?:[0-9A-Z][0-9A-Z]|[A-Z])`;
const Effect = String.raw`\[[^\]]+\]`;
export const Twin = String.raw`(\+)?[a-z]\) (\S[ \S]+\S)`;
const Normal = `(?:[nwb])?r?${P}?(?<from>${SQ})[-*](?<to>${SQ})(?:-(?<then>${SQ}))?`;
const Promotion = `=(?<pc>[nwb])?(?<p>${P})`;

// Note that effect could occur before or after promotion notation.
// This is one thing that is somewhat inconsistent in Popeye output.
export const Main = String.raw`(?:(?<move>0-0(?:-0)?|${Normal})(?:${Effect})*(?:${Promotion})?(?:=(?<cc>[nwb]))?(?<ep> ep\.)?)(?:${Effect})*`;
const Main_raw = Main.replace(/\?<[^>]+>/g, "");
export const Step = String.raw`(?<count>\d+\.(?:\.\.)?)?(?<main>${Main_raw}(?:\/${Main_raw})*)(?: [+#=])?`;

export function setPiece(board, sq, piece, color) {
	piece = toNormalPiece(piece);
	if(color == "w") piece = piece.toUpperCase();
	if(color == "b") piece = piece.toLowerCase();
	if(color == "n") piece = "-" + piece.toLowerCase();
	board[parseSquare(sq)] = piece;
}

export function movePiece(board, from, to) {
	from = parseSquare(from);
	to = parseSquare(to);
	board[to] = board[from];
	board[from] = "";
	return board[to];
}

/**
 * This is the mapping suggested by https://github.com/thomas-maeder/popeye/blob/develop/pie-engl.txt
 */
const defaultPieceMap = {
	"*1B": "25,37,AL,AN,BM,C,CT,DB,GN,GY,NH",
	"*1K": "PO",
	"*1N": "36,AO,BK,BN,DR,GR,KP,LS,MA,MS,OH,RK,S1,S2,S3,S4,SQ,SS,SW,UU,Z,ZE,ZH,ZR",
	"*1P": "BS,CP,MP",
	"*1Q": "EQ,HA,KH,L,LE,NE",
	"*1R": "DA,DK,EK,GT,MH,RM,RO,RR,SH,WA",
	"*2B": "15,AR,BH,BT,BU,BW,ND,PR",
	"*2K": "ST",
	"*2N": "N",
	"*2P": "BP",
	"*2Q": "G",
	"*2R": "DG,EM,RA,RF,RH,RW,WE",
	"*3B": "BE,BL,FE,GI,LO,OK,RB,VA",
	"*3K": "DU",
	"*3N": "24,35,AH,CA,DS,GH,MO,OA,SA",
	"*3P": "O,SP",
	"*3Q": "16,AM,EH,KA,LI,M,OR,SE,SI",
	"*3R": "BR,CH,CR,EA,FA,PA,RE,RL,TR",
	"A": "AG,B1,B2,B3,BI,BO,CG,CY,DO,ET,F,FR,G2,G3,GE,GF,GL,KL,KO,LB,LH,LN,LR,MG,ML,MM,NA,NL,NO,PP,QE,QF,QN,QQ,RN,RP,RT,SK,SO,TH,WR",
	"C": "I",
	"N": "S",
};

export const pieceMap = new Map();
for(const key in defaultPieceMap) {
	for(const s of defaultPieceMap[key].split(",")) pieceMap.set(s, key);
}

export function toNormalPiece(p) {
	const upper = p.toUpperCase();
	const normal = pieceMap.get(upper);
	if(normal) return p == upper ? normal : normal.toLowerCase();
	return p;
}
