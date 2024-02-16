const stub = document.createElement("canvas"); // for SSG

/** @type {HTMLCanvasElement} */
export const CN = document.getElementById("CN") || stub;

/** @type {HTMLCanvasElement} */
export const SN = document.getElementById("SN") || stub;

/** @type {HTMLCanvasElement} */
export const TP = document.getElementById("TP") || stub;

/** @type {HTMLCanvasElement} */
export const CG = document.getElementById("CanvasGhost") || stub;

/** @type {HTMLCanvasElement} */
export const TPG = document.getElementById("TemplateGhost") || stub;

/** @type {HTMLInputElement} */
export const FEN = document.getElementById("FEN");

/** @type {HTMLInputElement} */
export const DB = document.getElementById("DB");

/** @type {HTMLImageElement} */
export const PV = document.getElementById("PV");
