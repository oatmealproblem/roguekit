<script lang="ts">
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { quadIn, quadOut } from 'svelte/easing';
	import { SvelteMap } from 'svelte/reactivity';
	import { blur, fly } from 'svelte/transition';

	import abilities from '$lib/abilities';
	import actions from '$lib/actions';
	import { MAP_HEIGHT, MAP_WIDTH } from '$lib/constants';
	import { game } from '$lib/game.svelte';
	import { posToString } from '$lib/geo';
	import { rangeFromTo } from '$lib/math';
	import { type Ability,type Pos } from '$lib/types';

	let activeAbility = $state.raw<null | Ability>(null);
	let mousePos = $state.raw<null | Pos>(null);
	let player = $derived(game.get('player'));
	let highlighted = $derived(
		player && mousePos && activeAbility
			? activeAbility.highlight(player, mousePos, game)
			: { guide: [], hit: [] },
	);

	let defeat = $derived(!player);
	let victory = $derived(game.with('team').every((e) => e.team === 'player'));
	let gameOver = $derived(victory || defeat);

	let activeEffects = $state<Map<string, { id: string; type: string; pos: Pos }>>(new SvelteMap());
	let bumps = $state<Map<string, Pos>>(new SvelteMap());
	$effect(() =>
		game.registerVfxHandler((vfx, pos) => {
			const id = `${vfx},${posToString(pos)}`;
			if (vfx.startsWith('bump:')) {
				const id = vfx.split(':')[1];
				bumps.set(id, pos);
				setTimeout(() => bumps.delete(id), 100);
			} else if (!activeEffects.has(vfx)) {
				activeEffects.set(id, { id, type: vfx, pos });
				setTimeout(() => activeEffects.delete(id), 250);
			}
		}),
	);

	function getVfxAttributes(pos: Pos) {
		return {
			class: 'pointer-events-none absolute inline-block text-center transition-all',
			style: `
				top: ${(pos.y / MAP_HEIGHT) * 100}%;
				left: ${(pos.x / MAP_WIDTH) * 100}%;
				width: ${100 / MAP_WIDTH}vmin;
				height: ${100 / MAP_HEIGHT}vmin;
				font-size: ${100 / MAP_WIDTH / 1.5}vmin;
			`,
		};
	}
</script>

<svelte:window
	onkeydown={(e) => {
		const player = game.get('player');
		let turnTaken = false;
		if ((e.key === 'ArrowLeft' || e.key === 'a') && player) {
			const attackTarget = game.at({ x: player.x - 1, y: player.y }).find((e) => e.hp);
			if (attackTarget) {
				turnTaken = actions.attack({
					game,
					actor: player,
					target: attackTarget,
				});
			} else {
				turnTaken = actions.move({ game, actor: player, dx: -1, dy: 0 });
			}
		}
		if ((e.key === 'ArrowRight' || e.key === 'd') && player) {
			const attackTarget = game.at({ x: player.x + 1, y: player.y }).find((e) => e.hp);
			if (attackTarget) {
				turnTaken = actions.attack({
					game,
					actor: player,
					target: attackTarget,
				});
			} else {
				turnTaken = actions.move({ game, actor: player, dx: 1, dy: 0 });
			}
		}
		if ((e.key === 'ArrowUp' || e.key === 'w') && player) {
			const attackTarget = game.at({ x: player.x, y: player.y - 1 }).find((e) => e.hp);
			if (attackTarget) {
				turnTaken = actions.attack({
					game,
					actor: player,
					target: attackTarget,
				});
			} else {
				turnTaken = actions.move({ game, actor: player, dx: 0, dy: -1 });
			}
		}
		if ((e.key === 'ArrowDown' || e.key === 's') && player) {
			const attackTarget = game.at({ x: player.x, y: player.y + 1 }).find((e) => e.hp);
			if (attackTarget) {
				turnTaken = actions.attack({
					game,
					actor: player,
					target: attackTarget,
				});
			} else {
				turnTaken = actions.move({ game, actor: player, dx: 0, dy: 1 });
			}
		}
		if (e.key === 'e') {
			activeAbility = abilities.laser;
		}
		if (e.key === 'f') {
			activeAbility = abilities.shoot;
		}
		if (e.key === 'r') {
			activeAbility = abilities.blast;
		}

		if (turnTaken) {
			game.processTurn();
		}
	}}
/>

<Modal
	open={gameOver}
	triggerBase="hidden"
	contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm"
	backdropClasses="backdrop-blur-sm"
>
	{#snippet content()}
		{#if victory}
			Victory! All enemies defeated or befriended
		{:else}
			Defeat! You are dead
		{/if}
	{/snippet}
</Modal>

<div class="flex flex-wrap">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="bg-surface-50-950 relative flex flex-col"
		style:width="100vmin"
		style:height="100vmin"
		onmouseleave={() => {
			mousePos = null;
		}}
	>
		{#each rangeFromTo(0, MAP_HEIGHT) as y}
			<div class="flex flex-row">
				{#each rangeFromTo(0, MAP_WIDTH) as x}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<span
						class="text-surface-300-700 inline-block text-center select-none"
						class:bg-primary-100-900={highlighted?.guide.some(
							(pos) => pos.x === x && pos.y === y,
						) && !highlighted?.hit.some((pos) => pos.x === x && pos.y === y)}
						class:bg-error-200-800={highlighted?.hit.some((pos) => pos.x === x && pos.y === y)}
						style:width="{100 / MAP_WIDTH}vmin"
						style:height="{100 / MAP_HEIGHT}vmin"
						style:font-size="{100 / MAP_WIDTH / 1.5}vmin"
						onmouseenter={() => {
							mousePos = { x, y };
						}}
						onclick={() => {
							if (activeAbility && player) {
								activeAbility.execute(player, { x, y }, game);
								game.processTurn();
								activeAbility = null;
							}
						}}
						oncontextmenu={(e) => {
							e.preventDefault();
							activeAbility = null;
						}}
					>
						⋅
					</span>
				{/each}
			</div>
		{/each}
		{#each game.with('glyph') as entity (entity.id)}
			<span
				class="pointer-events-none absolute inline-block text-center transition-all"
				style:top="{(((bumps.get(entity.id)?.y ?? entity.y) + entity.y) / 2 / MAP_HEIGHT) * 100}%"
				style:left="{(((bumps.get(entity.id)?.x ?? entity.x) + entity.x) / 2 / MAP_WIDTH) * 100}%"
				style:color={entity.glyph?.color}
				style:width="{100 / MAP_WIDTH}vmin"
				style:height="{100 / MAP_HEIGHT}vmin"
				style:font-size="{100 / MAP_WIDTH / 1.5}vmin"
				out:blur
			>
				{entity.glyph?.char}
				{#if entity.hp}
					<span
						class="bg-secondary-300-700 absolute bottom-0 left-0 h-1"
						style:width="{(entity.hp.current / entity.hp.max) * 100}%"
					></span>
				{/if}
			</span>
		{/each}
		{#each activeEffects.values() as vfx (vfx.id)}
			{#if vfx.type === 'slash'}
				<span
					{...getVfxAttributes(vfx.pos)}
					class:text-error-500={true}
					class:font-bold={true}
					in:fly|global={{ x: 10, y: -30, easing: quadIn, duration: 250 }}
					out:fly|global={{ x: -10, y: 30, easing: quadOut, duration: 250 }}
				>
					/
				</span>
			{/if}
		{/each}
	</div>
	<div class="p-4">
		{#if player?.hp?.current}
			HP: {player?.hp?.current}/{player?.hp?.max}
		{:else}
			DEAD
		{/if}
	</div>
</div>
