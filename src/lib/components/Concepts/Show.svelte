<script>
	import Abstractions from '../Page/Tabs/Abstractions/Abstractions.svelte';
	import Quizzes from '../Page/Tabs/Quiz/Quizzes.svelte';
	import Scripts from '../Page/Tabs/Scripts/Scripts.svelte';
	import Experiments from '../Page/Tabs/Experiments/Experiments.svelte';

	export let concept;

	let tabs = ['Abstractions', 'Quiz', 'Scripts', 'Experiments'];
	let activeTab = 'Abstractions';
</script>

<section class="wrapper">
	<h1 class="title">{concept.title}</h1>

	{#if concept.avatar_url}
		<img src={concept.avatar_url} alt={concept.title} class="avatar" />
	{/if}

	{#if concept.concept_type}
		<div class="concept-type">Type: {concept.concept_type}</div>
	{/if}

	{#if concept.start_year || concept.end_year}
		<div class="years">
			{#if concept.start_year}{concept.start_year}{/if}
			{#if concept.start_year && concept.end_year} - {/if}
			{#if concept.end_year}{concept.end_year}{/if}
		</div>
	{/if}

	<div class="flex" style="width: 100%; overflow-x: scroll">
		{#each tabs as tab}
			<div class="tab" class:active={activeTab === tab} on:click={() => (activeTab = tab)}>
				{tab}
			</div>
		{/each}
	</div>

	{#if activeTab === 'Abstractions'}
		<Abstractions element={concept} elementType="concepts" />
	{/if}

	{#if activeTab === 'Quiz'}
		<Quizzes element={concept} elementType="concepts" />
	{/if}

	{#if activeTab === 'Scripts'}
		<Scripts element={concept} elementType="concepts" />
	{/if}

	{#if activeTab === 'Experiments'}
		<Experiments element={concept} elementType="concepts" />
	{/if}
</section>

<style>
	.tab {
		padding: 14px;
		cursor: pointer;
	}
	.tab.active {
		background-color: #000;
		color: #fff;
	}
	.flex {
		display: flex;
	}

	.flex > div {
		flex: 1 1 25%;
		text-align: center;
	}

	.title {
		padding: 40px 0px;
	}
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	.avatar {
		max-width: 300px;
		height: auto;
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.concept-type {
		font-size: 18px;
		color: #666;
		margin-bottom: 10px;
		text-transform: capitalize;
	}

	.years {
		font-size: 18px;
		color: #666;
		margin-bottom: 10px;
	}

	@media (max-width: 480px) {
		.wrapper {
			padding: 4px;
		}

		.title {
			padding: 40px 20px;
			font-size: 24px;
		}
	}
</style>
