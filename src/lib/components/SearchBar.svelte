<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { concepts } from '$lib/stores/main';
	import Api from '$lib/api/api/api.js';

	let wondersQuery = '';
	let skillsQuery = '';
	let mapShown = false;
	let showConceptResults = false;
	let conceptResults: any[] = [];

	const toggleMap = () => {
		mapShown = !mapShown;
	};

	onMount(async () => {
		// Load concepts if not already loaded
		if ($concepts.length === 0) {
			const response = await Api.get('/concepts.json');
			concepts.set(response);
		}
	});

	const handleConceptInputClick = () => {
		if (skillsQuery.length > 0) return;
		// Show random concepts when clicking empty input
		let randomItems: any[] = [];
		while (randomItems.length < 6 && $concepts.length > 0) {
			const randomElement = $concepts[Math.floor(Math.random() * $concepts.length)];
			if (randomItems.indexOf(randomElement) > -1) {
				continue;
			}
			randomItems.push(randomElement);
		}
		showConceptResults = true;
		conceptResults = randomItems;
	};

	const searchConcepts = (query: string) => {
		if (query.length > 0 && query.length < 2) {
			showConceptResults = false;
		} else if (query.length > 1) {
			showConceptResults = true;
			// Case-insensitive search
			const queryUpper = query.toUpperCase();
			conceptResults = $concepts.filter(
				(item: any) => item.title && item.title.toUpperCase().indexOf(queryUpper) > -1
			);
		} else {
			showConceptResults = false;
		}
	};

	const handleConceptSelect = (concept: any) => {
		goto(`/concepts/${concept.id}`);
		skillsQuery = '';
		showConceptResults = false;
	};

	$: {
		searchConcepts(skillsQuery);
	}
</script>

<div class="search-row">
	<div class="search-col search-col-left">
		<div class="cta-search">
			<u>Philosophers</u>
		</div>
		<input
			type="text"
			bind:value={wondersQuery}
			placeholder="Search Philosophers..."
			class="search-input"
		/>
	</div>

	<div class="search-col search-col-center">
		<button class="map-button" class:btn-open={mapShown} on:click={toggleMap} aria-label="Show Map">
			<i class="fa fa-map"></i>
		</button>
	</div>

	<div class="search-col search-col-right">
		<div class="cta-search">
			<a href="/concepts/mapper">Concepts</a> | <a href="/concepts/timeline">Timeline</a>
		</div>
		<div class="search-input-wrapper">
			<input
				type="text"
				bind:value={skillsQuery}
				on:click={handleConceptInputClick}
				on:blur={() =>
					setTimeout(function () {
						showConceptResults = false;
					}, 200)}
				placeholder="Search Concepts..."
				class="search-input"
			/>
			{#if conceptResults && showConceptResults && conceptResults.length > 0}
				<ul class="search-results">
					{#each conceptResults as concept}
						<li>
							<a href="/concepts/{concept.id}" on:click={() => handleConceptSelect(concept)}
								>{concept.title}</a
							>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>

<style>
	.search-row {
		display: flex;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
		box-sizing: border-box;
		gap: 1.25rem;
		position: relative;
		align-items: flex-end;
	}

	.search-col {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.search-col-left,
	.search-col-right {
		flex: 1 1 0;
		min-width: 0;
	}

	.search-col-center {
		flex: 0 0 auto;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 0;
	}

	.search-input-wrapper {
		position: relative;
		width: 100%;
	}

	.cta-search {
		position: absolute;
		top: -24px;
		left: 0;
		right: 0;
		text-align: left;
		font-size: 13px;
		color: #c45a4e;
		font-weight: 500;
		letter-spacing: 0.02em;
		margin-bottom: 4px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	.cta-search u {
		text-decoration: underline;
		text-decoration-thickness: 1.2px;
		text-underline-offset: 2px;
	}

	.search-input {
		padding: 22px 24px;
		font-size: 22px;
		border: 1px solid #d5d5d5;
		margin: 0;
		background: #f0f0f0;
		width: 100%;
		box-sizing: border-box;
		border-radius: 8px;
		color: #2a2a2a;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		height: 72px;
		line-height: 28px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		font-weight: 400;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.search-input:hover {
		background: #f5f5f5;
		border-color: #c0c0c0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.search-input:focus {
		outline: none;
		background: #ffffff;
		border-color: #97b1ff;
		box-shadow:
			0 0 0 3px rgba(151, 177, 255, 0.1),
			0 2px 6px rgba(0, 0, 0, 0.08);
	}

	.search-input::placeholder {
		color: #8a8a8a;
		font-weight: 300;
		opacity: 0.8;
	}

	.map-button {
		width: 90px;
		height: 72px;
		min-width: 90px;
		min-height: 72px;
		padding: 0;
		margin: 0;
		cursor: pointer;
		border: 1px solid #b8b8b8;
		overflow: hidden;
		text-decoration: none;
		white-space: nowrap;
		text-align: center;
		font-size: 32px;
		color: #416fff;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.95) 0%,
			rgba(230, 230, 230, 0.9) 100%
		);
		border-radius: 8px;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.08),
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			0 -1px 2px rgba(0, 0, 0, 0.05) inset;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.map-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(0, 0, 0, 0.05) 100%);
		pointer-events: none;
		border-radius: 8px;
	}

	.map-button:hover {
		background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%);
		border-color: #a0a0a0;
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.12),
			0 1px 0 rgba(255, 255, 255, 0.8) inset,
			0 -1px 2px rgba(0, 0, 0, 0.08) inset;
		transform: translateY(-1px);
	}

	.map-button:active {
		transform: translateY(0);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.1),
			0 1px 0 rgba(255, 255, 255, 0.5) inset;
	}

	.map-button.btn-open {
		background: linear-gradient(to bottom, #4d75ff 0%, #416fff 100%);
		color: #ffffff;
		border-color: #3555cc;
		box-shadow:
			0 2px 6px rgba(65, 111, 255, 0.3),
			0 1px 0 rgba(255, 255, 255, 0.2) inset,
			0 -1px 2px rgba(0, 0, 0, 0.2) inset;
	}

	.map-button.btn-open:hover {
		background: linear-gradient(to bottom, #557aff 0%, #4a6aff 100%);
		transform: translateY(-1px);
		box-shadow:
			0 4px 10px rgba(65, 111, 255, 0.4),
			0 1px 0 rgba(255, 255, 255, 0.25) inset;
	}

	.map-button.btn-open::before {
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%);
	}

	.map-button .fa {
		font-size: 32px;
		position: relative;
		z-index: 1;
		filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
	}

	.map-button.btn-open .fa {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
	}

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff;
		border: 2px solid #5f4a4a;
		border-radius: 8px;
		margin-top: 4px;
		padding: 0;
		list-style: none;
		z-index: 999;
		max-height: 400px;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.search-results li {
		padding: 16px 24px;
		border-bottom: 1px solid #e0e0e0;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.search-results li:last-child {
		border-bottom: none;
	}

	.search-results li:hover {
		background-color: #ffffc7;
	}

	.search-results li a {
		display: block;
		text-decoration: none;
		color: #2a2a2a;
		font-size: 18px;
		font-weight: 400;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	.search-results li:hover a {
		color: #000;
	}

	@media (max-width: 768px) {
		.search-row {
			padding: 0 1rem;
			gap: 0.75rem;
		}

		.search-input {
			font-size: 18px;
			padding: 18px 16px;
			height: 68px;
		}

		.map-button {
			width: 70px;
			height: 68px;
			min-width: 70px;
			min-height: 68px;
		}

		.map-button .fa {
			font-size: 26px;
		}

		.cta-search {
			font-size: 12px;
			top: -20px;
		}
	}

	@media (max-width: 480px) {
		.search-row {
			padding: 0 0.75rem;
			gap: 0.5rem;
		}

		.cta-search {
			font-size: 11px;
			top: -18px;
		}

		.search-input {
			font-size: 16px;
			padding: 16px 12px;
			height: 64px;
			line-height: 24px;
		}

		.map-button {
			width: 64px;
			height: 64px;
			min-width: 64px;
			min-height: 64px;
		}

		.map-button .fa {
			font-size: 24px;
		}

		.search-results {
			font-size: 16px;
		}

		.search-results li {
			padding: 12px 16px;
		}

		.search-results li a {
			font-size: 16px;
		}
	}
</style>
