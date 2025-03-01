import type { Game } from '$lib/game.svelte';
import type { Entity } from '$lib/types';

export function damage({ game, target, amount }: { game: Game; target: Entity; amount: number }) {
	if (target.hp) {
		target.hp.current -= amount;
		if (target.hp.current <= 0) {
			game.remove(target);
		}
		return true;
	}
	return false;
}
