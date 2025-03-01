import type { Pos } from '$lib/types';

import { MAP_HEIGHT, MAP_WIDTH } from './constants';
import { rangeFromTo } from './math';

export function getEuclideanDistance(from: Pos, to: Pos) {
	return Math.hypot(to.x - from.x, to.y - from.y);
}

export function getManhattanDistance(from: Pos, to: Pos) {
	return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

export function getChebyshevDistance(from: Pos, to: Pos) {
	return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
}

export function getPosInRange(
	from: Pos,
	range: number,
	distanceType: 'euclidean' | 'manhattan' | 'chebyshev',
): Pos[] {
	return rangeFromTo(from.x - range, from.x + range, { inclusive: true })
		.flatMap((x) =>
			rangeFromTo(from.y - range, from.y + range, { inclusive: true }).map((y) => ({ x, y })),
		)
		.filter((pos) => {
			if (distanceType === 'euclidean') {
				return getEuclideanDistance(from, pos) <= range;
			}
			if (distanceType === 'manhattan') {
				return getManhattanDistance(from, pos) <= range;
			}
			return true;
		});
}

export function getAdjacentPositions(from: Pos): Pos[] {
	return [
		{ x: from.x, y: from.y - 1 },
		{ x: from.x + 1, y: from.y },
		{ x: from.x, y: from.y + 1 },
		{ x: from.x - 1, y: from.y },
	];
}

export function getLine(from: Pos, to: Pos): Pos[] {
	const points: Pos[] = [];
	const distance = getChebyshevDistance(from, to);
	for (let step = 0; step <= distance; step++) {
		const t = distance === 0 ? 0.0 : step / distance;
		points.push(roundPos(interpolatePos(from, to, t)));
	}
	return points;
}

export function roundPos(pos: Pos): Pos {
	return { x: Math.round(pos.x), y: Math.round(pos.y) };
}

function interpolatePos(from: Pos, to: Pos, t: number) {
	return { x: interpolate(from.x, to.x, t), y: interpolate(from.y, to.y, t) };
}

function interpolate(from: number, to: number, t: number) {
	return from * (1.0 - t) + t * to;
}

/**
 * Like getLine, but continues the line past the destination to the the edge of the map
 */
export function getRay(from: Pos, to: Pos): Pos[] {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const multiplier = Math.ceil(Math.max(MAP_WIDTH, MAP_HEIGHT) / getChebyshevDistance(from, to));
	const furtherTo = { x: from.x + dx * multiplier, y: from.y + dy * multiplier };
	return getLine(from, furtherTo);
}

export function posToString(pos: Pos): string {
	return `${pos.x},${pos.y}`;
}

export function stringToPos(str: string): Pos {
	const [x, y] = str.split(',').map((n) => parseFloat(n));
	return { x, y };
}

export function isSamePos(a: Pos): (b: Pos) => boolean;
export function isSamePos(a: Pos, b: Pos): boolean;
export function isSamePos(a: Pos, b?: Pos): boolean | ((b: Pos) => boolean) {
	const partial = (b: Pos) => a.x === b.x && a.y == b.y;
	return b ? partial(b) : partial;
}

export function isOutOfBounds({ x, y }: Pos) {
	return x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT;
}
