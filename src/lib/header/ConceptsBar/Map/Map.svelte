<script>
	import { conceptsMap } from '$lib/stores/main';
	import { get } from 'svelte/store';
	import Row from './Row/Row.svelte';

	let show = 'concepts';

	const handleToggleView = (target) => {
		show = target;
	};

	$: console.log(show);
</script>

{#if show === 'concepts'}
	<button on:click={() => handleToggleView('wonders')}>Switch To Wonders?</button>

	{#each $conceptsMap as concept}
		<ul>
			<Row item={concept} type="concept" />
		</ul>
	{/each}
{/if}

<style>
	ul {
		list-style: none;
	}

	button {
		position: relative;
		top: -9px;
		left: -15px;
		color: #755c0f;
		border: 2px solid #ffc107;
		display: inline-block;
		font-weight: 400;
		color: #212529;
		text-align: center;
		vertical-align: middle;
		cursor: pointer;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		background-color: transparent;
		padding: 0.375rem 0.75rem;
		font-size: 1rem;
		line-height: 1.5;
		border-radius: 0.25rem;
		transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
			border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
	}
</style>

