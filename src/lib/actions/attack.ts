import type { Game } from '$lib/game.svelte';
import type { Entity } from '$lib/types';

import { damage } from './damage';

export function attack({ game, actor, target }: { game: Game; actor: Entity; target: Entity }) {
	if (target.hp && actor.attack) {
		damage({ game, target, amount: actor.attack.damage });
		game.playVfx('slash', target);
		game.playVfx(`bump:${actor.id}`, target);
		game.playSfx('knifeSlice');
		return true;
	}
	return false;
}
