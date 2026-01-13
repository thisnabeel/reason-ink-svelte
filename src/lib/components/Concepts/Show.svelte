<script>
	import Abstractions from '../Page/Tabs/Abstractions/Abstractions.svelte';
	import Quizzes from '../Page/Tabs/Quiz/Quizzes.svelte';
	import Scripts from '../Page/Tabs/Scripts/Scripts.svelte';
	import Experiments from '../Page/Tabs/Experiments/Experiments.svelte';
	import Phrases from '../Page/Tabs/Phrases/Phrases.svelte';
	import Api from '$lib/api/api/api.js';

	export let concept;

	let tabs = ['Abstractions', 'Quiz', 'Scripts', 'Experiments', 'Phrases'];
	let activeTab = 'Abstractions';

	let editingStartYear = false;
	let editingEndYear = false;
	let tempStartYear = concept.start_year || '';
	let tempEndYear = concept.end_year || '';

	let timer;
	const saveYear = (field, value) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const numValue = value === '' || value === null ? null : parseInt(value);
			if (isNaN(numValue) && value !== '' && value !== null) return; // Don't save invalid numbers

			const updated = await Api.put(`/concepts/${concept.id}`, {
				concept: {
					[field]: numValue
				}
			});
			concept[field] = updated[field];
		}, 1000);
	};

	const startEditStartYear = () => {
		editingStartYear = true;
		tempStartYear = concept.start_year || '';
	};

	const startEditEndYear = () => {
		editingEndYear = true;
		tempEndYear = concept.end_year || '';
	};

	const finishEditStartYear = () => {
		editingStartYear = false;
		saveYear('start_year', tempStartYear);
	};

	const finishEditEndYear = () => {
		editingEndYear = false;
		saveYear('end_year', tempEndYear);
	};

	const handleTypeChange = async () => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const updated = await Api.put(`/concepts/${concept.id}`, {
				concept: {
					concept_type: concept.concept_type
				}
			});
			concept.concept_type = updated.concept_type;
		}, 300);
	};
</script>

<section class="wrapper">
	<h1 class="title">{concept.title}</h1>

	{#if concept.avatar_url}
		<img src={concept.avatar_url} alt={concept.title} class="avatar" />
	{/if}

	<div class="concept-type-wrapper">
		<label for="concept-type-select">Type:</label>
		<select
			id="concept-type-select"
			class="concept-type-select"
			bind:value={concept.concept_type}
			on:change={handleTypeChange}
		>
			<option value="person">Person</option>
			<option value="idea">Idea</option>
			<option value="movement">Movement</option>
			<option value="book">Book</option>
		</select>
	</div>

	<div class="years-row">
		{#if editingStartYear}
			<input
				type="number"
				class="year-pill year-input"
				bind:value={tempStartYear}
				on:blur={finishEditStartYear}
				on:keydown={(e) => e.key === 'Enter' && finishEditStartYear(e)}
				autofocus
			/>
		{:else}
			<div class="year-pill" on:click={startEditStartYear}>
				{concept.start_year || 'Start'}
			</div>
		{/if}
		<span class="year-separator">—</span>
		{#if editingEndYear}
			<input
				type="number"
				class="year-pill year-input"
				bind:value={tempEndYear}
				on:blur={finishEditEndYear}
				on:keydown={(e) => e.key === 'Enter' && finishEditEndYear(e)}
				autofocus
			/>
		{:else}
			<div class="year-pill" on:click={startEditEndYear}>
				{concept.end_year || 'End'}
			</div>
		{/if}
	</div>

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

	{#if activeTab === 'Phrases'}
		<Phrases element={concept} elementType="concepts" />
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
		flex: 1 1 20%;
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

	.concept-type-wrapper {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
	}

	.concept-type-wrapper label {
		font-size: 18px;
		color: #666;
		font-weight: 500;
	}

	.concept-type-select {
		padding: 8px 16px;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: #fff;
		font-size: 16px;
		color: #333;
		cursor: pointer;
		outline: none;
		transition: all 0.2s ease;
		min-width: 150px;
	}

	.concept-type-select:hover {
		border-color: #999;
	}

	.concept-type-select:focus {
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	.years-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
		justify-content: flex-start;
	}

	.year-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		background: #f0f0f0;
		border-radius: 9999px;
		font-size: 14px;
		font-weight: 500;
		color: #333;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 80px;
		text-align: center;
		border: 2px solid transparent;
	}

	.year-pill:hover {
		background: #e0e0e0;
		border-color: #999;
	}

	.year-input {
		background: #fff;
		border: 2px solid #4a90e2;
		padding: 8px 16px;
		border-radius: 9999px;
		font-size: 14px;
		font-weight: 500;
		color: #333;
		min-width: 80px;
		text-align: center;
		outline: none;
		cursor: text;
	}

	.year-separator {
		color: #999;
		font-size: 18px;
		font-weight: 300;
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
