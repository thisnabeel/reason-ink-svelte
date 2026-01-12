<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api/api.js';
	import ExperimentModal from './ExperimentModal.svelte';

	let conceptExperiments = /** @type {any[]} */ ([]);
	let selectedExperiment = /** @type {any} */ (null);
	let showModal = false;
	let loading = true;

	onMount(async () => {
		await fetchExperiments();
	});

	const fetchExperiments = async () => {
		try {
			const data = await Api.get('/concept_experiments.json');
			// Shuffle the array
			conceptExperiments = data.sort(() => Math.random() - 0.5);
		} catch (error) {
			console.error('Error fetching experiments:', error);
		} finally {
			loading = false;
		}
	};

	const openModal = (/** @type {any} */ conceptExperiment) => {
		selectedExperiment = conceptExperiment.experiment;
		selectedExperiment.conceptTitle = conceptExperiment.concept.title;
		showModal = true;
	};

	const closeModal = () => {
		showModal = false;
		selectedExperiment = null;
	};
</script>

{#if loading}
	<div class="loading">Loading experiments...</div>
{:else if conceptExperiments.length === 0}
	<div class="empty">No thought experiments yet.</div>
{:else}
	<div class="masonry">
		{#each conceptExperiments as conceptExperiment}
			{#if conceptExperiment.experiment && conceptExperiment.concept}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="card"
					role="button"
					tabindex="0"
					on:click={() => openModal(conceptExperiment)}
					on:keydown={(e) => e.key === 'Enter' && openModal(conceptExperiment)}
				>
					<div class="concept-badge">{conceptExperiment.concept.title}</div>
					<h3 class="experiment-title">
						{@html conceptExperiment.experiment.title || 'Untitled Experiment'}
					</h3>
				</div>
			{/if}
		{/each}
	</div>
{/if}

{#if showModal && selectedExperiment}
	<ExperimentModal {selectedExperiment} on:close={closeModal} />
{/if}

<style>
	.loading,
	.empty {
		text-align: center;
		padding: 60px 20px;
		font-size: 24px;
		color: #666;
	}

	.masonry {
		column-count: 3;
		column-gap: 32px;
		padding: 32px 24px;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	.card {
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 32px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: inline-block;
		width: 100%;
		box-sizing: border-box;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		break-inside: avoid;
		page-break-inside: avoid;
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
		border-color: #999;
	}

	.concept-badge {
		display: inline-block;
		background: #f0f0f0;
		color: #666;
		font-size: 11px;
		padding: 6px 16px;
		border-radius: 9999px;
		margin-bottom: 16px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	.experiment-title {
		font-size: 20px;
		font-weight: 700;
		margin: 0;
		color: #000;
		line-height: 1.3;
	}

	@media (max-width: 1024px) {
		.masonry {
			column-count: 2;
			column-gap: 24px;
			padding: 24px 16px;
		}

		.card {
			margin-bottom: 24px;
		}
	}

	@media (max-width: 640px) {
		.masonry {
			column-count: 1;
			column-gap: 0;
			padding: 20px 16px;
			width: 100%;
			max-width: 100%;
		}

		.card {
			padding: 20px;
			margin-bottom: 20px;
			width: 100%;
			max-width: 100%;
			box-sizing: border-box;
		}

		.experiment-title {
			font-size: 18px;
			word-wrap: break-word;
			overflow-wrap: break-word;
		}
	}
</style>
