<script>
	import { initGame } from '../lib/game.svelte';
</script>

<h1 class="h1 mt-8 text-center">Roguekit</h1>
<div class="card preset-filled-surface-200-800 mx-auto my-4 flex w-96 flex-col gap-2 p-4">
	<a class="btn btn-lg preset-filled-primary-600-400" href="#/game">Continue</a>
	<a class="btn btn-lg preset-filled-secondary-600-400" href="#/game" onclick={initGame}>
		New Game
	</a>
	<a class="btn btn-lg preset-filled-secondary-600-400" href="#/settings">Settings</a>
</div>
