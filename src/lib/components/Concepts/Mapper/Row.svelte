<script>
	import { goto } from '$app/navigation';
	import { selectedConcept, selectConcept } from '$lib/stores/main';

	export let item;
	export let type;
	export let removeConcept;

	function handleConceptClick() {
		if ($selectedConcept && $selectedConcept.id === item.id) {
			selectConcept(null);
		} else {
			selectConcept(item);
		}
	}

	function handleLinkClick() {
		goto('/concepts/' + item.id);
	}
</script>

<li class="concept" class:selected={$selectedConcept && item.id === $selectedConcept.id}>
	<span class="title" on:click={handleConceptClick}>{item.title}</span>
	{#if $selectedConcept && item.id === $selectedConcept.id}
		<i
			class="fa fa-link link-btn"
			on:click={handleLinkClick}
			title="View concept"
		></i>
		{#if removeConcept}
			<i
				class="fa fa-trash delete-btn"
				on:click={() => removeConcept(item)}
				title="Delete concept"
			></i>
		{/if}
	{/if}

	{#each item.child_concepts || [] as childConcept}
		<svelte:self item={childConcept} {type} {removeConcept} />
	{/each}
</li>

<style>
	.concept {
		position: relative;
		margin-left: 10px;
		border-left: 6px solid #ffeaa7;
		font-size: 18px;
		margin-bottom: 0;
		padding-left: 12px;
		cursor: pointer;
	}

	.concept:hover {
		border-left: 6px #416fff solid;
	}

	.selected {
		background: rgb(199, 199, 255);
	}

	.title {
		width: 100%;
		padding: 14px;
		display: block;
		font-size: 28px;
	}

	.link-btn,
	.delete-btn {
		display: none;
		color: #ccc;
		position: absolute;
		top: 10px;
		font-size: 46px;
		cursor: pointer;
	}

	.link-btn {
		left: -55px;
	}

	.delete-btn {
		left: -105px;
		color: #dc3545;
	}

	.link-btn:hover {
		color: rgb(221, 255, 128);
	}

	.delete-btn:hover {
		color: #c82333;
	}

	.selected > .link-btn,
	.selected > .delete-btn {
		display: inline;
	}

	.concept :global(.concept) {
		margin-left: 24px;
		border-left: 1px solid #ccc;
	}
</style>
