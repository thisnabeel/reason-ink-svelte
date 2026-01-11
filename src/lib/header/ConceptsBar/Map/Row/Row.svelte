<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api/api.js';
	import { goto } from '$app/navigation';
	import { selectConcept, selectedConcept } from '$lib/stores/main';

	let select;

	export let item;
	export let type;

	if (type === 'concept') select = selectConcept;

	const handleConceptClick = async (id) => {
		const endpoint = '/concepts/' + item.id;
		const response = await Api.get(endpoint);
		goto(endpoint);
	};
</script>

{#if type === 'concept'}
	<li class="concept">
		<span on:click|once={handleConceptClick(item.id)}>{item.title}</span>

		{#each item.child_concepts || [] as childConcept}
			<svelte:self item={childConcept} type="concept" />
		{/each}
	</li>
{/if}

<style>
	li {
		margin-left: 10px;
		border-left: 6px solid #ffeaa7;
		font-size: 18px;
		margin-bottom: 0;
		padding-left: 12px;
		cursor: pointer;
	}

	li:hover {
		border-left: 6px #416fff solid;
	}

	.concept[abstra-count='0'] {
		color: #ccc;
	}
</style>

