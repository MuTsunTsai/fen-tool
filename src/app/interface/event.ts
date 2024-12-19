import { Rotation } from "app/meta/enum";
import { getRenderSize } from "app/store";

export type FederatedEvent = MouseEvent & TouchEvent;
export type MixedEvent = Partial<Writeable<MouseEvent> & TouchEvent> & {
	[k in keyof MouseEvent & keyof TouchEvent]: MouseEvent[k];
};

export function wrapEvent(event: MixedEvent): FederatedEvent {
	if(event.targetTouches) {
		const bcr = (event.target as HTMLElement).getBoundingClientRect();
		const touch = event.targetTouches[0] || event.changedTouches![0];
		event.clientX = touch.clientX;
		event.clientY = touch.clientY;
		event.offsetX = event.clientX - bcr.x;
		event.offsetY = event.clientY - bcr.y;
	}
	return event as FederatedEvent;
}

export function getXY(event: FederatedEvent, element: HTMLElement): IPoint {
	const { s, offset } = getRenderSize();
	const r = element.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - offset.y) / s);
	const x = Math.floor((event.clientX - r.left - offset.x) / s);
	return { x, y };
}

export function getRotation(path: IPoint[]): Rotation {
	const center = getCenter(path);
	const wn = windingNumber(center, path);
	return wn > 0 ? Rotation.r90 : Rotation.r270;
}

function getCenter(points: IPoint[]): IPoint {
	let x = 0, y = 0;
	for(const point of points) {
		x += point.x;
		y += point.y;
	}
	x /= points.length;
	y /= points.length;
	return { x, y };
}

function windingNumber(center: IPoint, points: IPoint[]): number {
	let wn = 0;
	for(let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const pi = points[i], pj = points[j];
		if(pj.y <= center.y) {
			if(pi.y > center.y) {
				if(isLeft(pj, pi, center) > 0) wn++;
			}
		} else {
			if(pi.y <= center.y) {
				if(isLeft(pj, pi, center) < 0) wn--;
			}
		}
	}
	return wn;
}

function isLeft(P0: IPoint, P1: IPoint, P2: IPoint): number {
	const res = (P1.x - P0.x) * (P2.y - P0.y) -
		(P2.x - P0.x) * (P1.y - P0.y);
	return res;
}
export function getDisplacement(event: FederatedEvent, pt: IPoint): number {
	const dx = event.offsetX - pt.x;
	const dy = event.offsetY - pt.y;
	const result = Math.sqrt(dx * dx + dy * dy);
	return result;
}
