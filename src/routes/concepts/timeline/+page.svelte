<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Api from '$lib/api/api/api.js';

	let concepts = [];
	let loading = true;

	onMount(async () => {
		await fetchConcepts();
	});

	const fetchConcepts = async () => {
		try {
			const data = await Api.get('/concepts/timeline.json');
			concepts = data;
		} catch (error) {
			console.error('Error fetching timeline:', error);
		} finally {
			loading = false;
		}
	};

	const handleConceptClick = (concept) => {
		goto(`/concepts/${concept.id}`);
	};
</script>

<svelte:head>
	<title>Timeline - Concepts</title>
	<meta name="description" content="Timeline of concepts ordered by start year" />
</svelte:head>

<section class="timeline-wrapper">
	<h1>Timeline</h1>

	{#if loading}
		<div class="loading">Loading timeline...</div>
	{:else if concepts.length === 0}
		<div class="empty">No concepts with end years found.</div>
	{:else}
		<div class="timeline">
			<div class="timeline-track">
				{#each concepts as concept, index}
				<div class="timeline-item" class:even={index % 2 === 0} on:click={() => handleConceptClick(concept)}>
					<div class="year-marker">{concept.end_year}</div>
						<div class="concept-card">
							<h3 class="concept-title">{concept.title}</h3>
							{#if concept.concept_type}
								<div class="concept-type">{concept.concept_type}</div>
							{/if}
							{#if concept.end_year}
								<div class="year-range">
									{concept.start_year} — {concept.end_year}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.timeline-wrapper {
		padding: 40px 20px;
		min-height: 100vh;
		background: #f5f5f5;
		width: 100%;
	}

	h1 {
		font-size: 48px;
		font-weight: 700;
		margin: 0 0 40px 0;
		color: #000;
		text-align: center;
	}

	.loading,
	.empty {
		text-align: center;
		padding: 60px 20px;
		font-size: 24px;
		color: #666;
	}

	.timeline {
		width: 100%;
	}

	.timeline-track {
		position: relative;
		width: 100%;
		padding: 40px 0;
	}

	.timeline-track::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2px;
		background: #e0e0e0;
		transform: translateX(-50%);
		z-index: 0;
	}

	.timeline-item {
		position: relative;
		display: flex;
		align-items: center;
		margin-bottom: 60px;
		cursor: pointer;
		z-index: 1;
	}

	.timeline-item.even {
		flex-direction: row;
	}

	.timeline-item:not(.even) {
		flex-direction: row-reverse;
	}

	.year-marker {
		font-size: 24px;
		font-weight: 700;
		color: #4a90e2;
		width: 50%;
		text-align: center;
		position: relative;
		padding: 0 20px;
	}

	.timeline-item.even .year-marker {
		text-align: right;
	}

	.timeline-item:not(.even) .year-marker {
		text-align: left;
	}

	.year-marker::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 16px;
		height: 16px;
		background: #4a90e2;
		border-radius: 50%;
		transform: translateY(-50%);
		box-shadow: 0 0 0 4px #f5f5f5;
	}

	.timeline-item.even .year-marker::after {
		right: 0;
	}

	.timeline-item:not(.even) .year-marker::after {
		left: 0;
	}

	.concept-card {
		width: 45%;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease;
	}

	.timeline-item:hover .concept-card {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		border-color: #999;
		transform: translateY(-2px);
	}

	.concept-title {
		font-size: 24px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #000;
	}

	.concept-type {
		font-size: 12px;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 8px;
		font-weight: 600;
	}

	.year-range {
		font-size: 14px;
		color: #999;
		margin-top: 8px;
	}

	@media (max-width: 768px) {
		.timeline-wrapper {
			padding: 20px 10px;
		}

		h1 {
			font-size: 32px;
			margin-bottom: 24px;
		}

		.timeline-track::before {
			left: 40px;
		}

		.timeline-item {
			flex-direction: row !important;
			margin-bottom: 40px;
		}

		.year-marker {
			width: 80px;
			text-align: left !important;
			font-size: 18px;
			padding: 0 10px;
		}

		.year-marker::after {
			left: 0 !important;
			right: auto !important;
		}

		.concept-card {
			width: calc(100% - 100px);
		}

		.concept-title {
			font-size: 20px;
		}
	}
</style>

