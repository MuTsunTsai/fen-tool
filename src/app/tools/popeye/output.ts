import { nextTick } from "vue";

const el = document.getElementById("Output") as HTMLDivElement;

let shouldScroll = false;

function isAlmostBottom(): boolean {
	const threshold = 30;
	return Boolean(el) && el.scrollTop + el.clientHeight + threshold > el.scrollHeight;
}

export function updateShouldScroll(): void {
	shouldScroll = shouldScroll || isAlmostBottom();
}

export function tryScroll(): void {
	if(shouldScroll) {
		shouldScroll = false;
		nextTick(() => el.scrollTop = el.scrollHeight - el.clientHeight);
	}
}

export function scrollTo(step: HTMLSpanElement): void {
	// We cannot simply use scrollIntoView here, as that will also scroll the entire page,
	// which is not the desired behavior.
	const margin = 10;
	const top = step.offsetTop - margin;
	if(el.scrollTop > top) el.scrollTop = top;
	const bottom = step.offsetTop + step.clientHeight - el.clientHeight + margin;
	if(el.scrollTop < bottom) el.scrollTop = bottom;
	const left = step.offsetLeft - margin;
	if(el.scrollLeft > left) el.scrollLeft = left;
	const right = step.offsetLeft + step.clientWidth - el.clientWidth + margin;
	if(el.scrollLeft < right) el.scrollLeft = right;
}

export function resetScroll(): void {
	el.scrollTop = el.scrollLeft = 0;
}

export function getSteps(): HTMLSpanElement[] {
	return [...el.querySelectorAll("span")];
}
