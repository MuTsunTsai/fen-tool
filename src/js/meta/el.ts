const stub = document.createElement("canvas"); // for SSG

export const CN = document.getElementById("CN") as HTMLCanvasElement || stub;

export const SN = document.getElementById("SN") as HTMLCanvasElement || stub;

export const TP = document.getElementById("TP") as HTMLCanvasElement || stub;

export const CG = document.getElementById("CanvasGhost") as HTMLCanvasElement || stub;

export const TPG = document.getElementById("TemplateGhost") as HTMLCanvasElement || stub;

export const PV = document.getElementById("PV") as HTMLImageElement;
