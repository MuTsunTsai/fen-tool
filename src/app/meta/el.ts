const stub = document.createElement("canvas"); // for SSG

export const cnvMain = document.getElementById("CN") as HTMLCanvasElement || stub;

export const cnvSquares = document.getElementById("SN") as HTMLCanvasElement || stub;

export const cnvTemplate = document.getElementById("TP") as HTMLCanvasElement || stub;

export const cnvGhost = document.getElementById("CanvasGhost") as HTMLCanvasElement || stub;

export const cnvTempGhost = document.getElementById("TemplateGhost") as HTMLCanvasElement || stub;

export const imgOverlay = document.getElementById("PV") as HTMLImageElement;
