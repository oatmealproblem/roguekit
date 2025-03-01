import type { Game } from './game.svelte';

export interface Pos {
	x: number;
	y: number;
}

export interface Ability {
	target: 'self' | 'tile' | 'enemy' | 'ally' | 'creature' | 'direction';
	highlight: (actor: Entity, targetPos: Pos, game: Game) => { guide: Pos[]; hit: Pos[] };
	execute: (actor: Entity, targetPos: Pos, game: Game) => void;
}

export interface Attack {
	damage: number;
}

export interface Glyph {
	char: string;
	color: string;
}

export interface HP {
	current: number;
	max: number;
}

export interface Entity {
	id: string;
	x: number;
	y: number;
	ai?: true;
	attack?: Attack;
	glyph?: Glyph;
	hp?: HP;
	player?: true;
	team?: string;
}
