export const CN = document.getElementById("CN");
export const TP = document.getElementById('TP');
export const CG = document.getElementById("CanvasGhost");
export const TPG = document.getElementById("TemplateGhost");
export const FEN = document.getElementById("FEN");

export function realSize() {
	return (CN.clientWidth - 2) / 8;
}
