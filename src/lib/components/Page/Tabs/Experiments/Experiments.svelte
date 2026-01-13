<script>
	export let element;
	export let elementType;
	import Api from '$lib/api/api/api.js';

	let experiments = element.experiments || [];
	let wizardLoading = false;
	let showWizard = false;
	let wizardPrompt = `Generate a thought experiment for one of the philosophies of ${element.title}. It should be bullet point digestible and minimal sized formatting. Max 300 characters. Return json format: {title: "the title of the thought experiment", body: "the body content of the thought experiment with HTML formatting for paragraphs and emphasis"}`;

	const addExperiment = async () => {
		// First create the experiment
		const experimentResponse = await Api.post('/experiments.json', {
			experiment: {
				title: 'New Experiment',
				body: ''
			}
		});

		// Then link it to the concept
		await Api.post('/concept_experiments.json', {
			concept_experiment: {
				concept_id: element.id,
				experiment_id: experimentResponse.id
			}
		});

		experiments = [...experiments, experimentResponse];
		element.experiments = experiments;
	};

	const toggleWizard = () => {
		showWizard = !showWizard;
		if (showWizard) {
			wizardPrompt = `Generate a thought experiment for one of the philosophies of ${element.title}. It should be bullet point digestible and minimal sized formatting. Max 300 characters. Return json format: {title: "the title of the thought experiment", body: "the body content of the thought experiment with HTML formatting for paragraphs and emphasis"}`;
		}
	};

	const runWizard = async () => {
		if (wizardLoading) return; // Prevent multiple simultaneous requests
		
		wizardLoading = true;
		try {
			// Generate experiment using wizard AI
			const experimentResponse = await Api.post(`/concepts/${element.id}/generate_experiment.json`, {
				prompt: wizardPrompt
			});
			
			// The experiment is already linked to the concept by the backend
			experiments = [...experiments, experimentResponse];
			element.experiments = experiments;
			showWizard = false;
		} catch (error) {
			console.error('Error generating experiment with wizard:', error);
			alert('Failed to generate experiment. Please try again.');
		} finally {
			wizardLoading = false;
		}
	};

	async function handleRemoveExperiment(experiment) {
		// Find the join record
		const conceptExperiments = await Api.get(`/concept_experiments.json?concept_id=${element.id}`);
		const joinRecord = conceptExperiments.find(
			(ce) => ce.concept_id === element.id && ce.experiment_id === experiment.id
		);

		if (joinRecord) {
			await Api.delete(`/concept_experiments/${joinRecord.id}`);
		}

		experiments = experiments.filter((e) => e.id !== experiment.id);
		element.experiments = experiments;
	}

	let timer;
	const saveExperiment = (experiment, field, value) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			await Api.put(`/experiments/${experiment.id}`, {
				experiment: {
					[field]: value
				}
			});
		}, 1000);
	};
</script>

<div class="experiments-container">
	{#if showWizard}
		<div class="wizard-form">
			<textarea
				class="wizard-input"
				bind:value={wizardPrompt}
				placeholder="Enter your prompt..."
				rows="3"
			></textarea>
			<button class="run-button" on:click={runWizard} disabled={wizardLoading}>
				{#if wizardLoading}
					<i class="fa fa-spinner fa-spin"></i> Generating...
				{:else}
					Run
				{/if}
			</button>
		</div>
	{/if}

	<ul class="experiments">
		{#if experiments.length > 0}
			{#each experiments as experiment}
				<li class="experiment">
					<span
						contenteditable
						on:keyup={(e) => saveExperiment(experiment, 'title', e.target.innerHTML)}>{@html experiment.title || ''}</span
					>
					<div
						class="body"
						contenteditable
						on:keyup={(e) => saveExperiment(experiment, 'body', e.target.innerHTML)}>{@html experiment.body || ''}</div
					>
					<span class="fa fa-trash" on:click={() => handleRemoveExperiment(experiment)} />
				</li>
			{/each}
		{:else}
			<li>
				<div class="cta">
					<h1>No Experiments Yet.</h1>
				</div>
			</li>
		{/if}
	</ul>

	<div class="adder">
		<div class="add-experiment" on:click={addExperiment}>+</div>
		<div class="wizard-experiment" class:loading={wizardLoading} on:click={toggleWizard}>
			{#if wizardLoading}
				<i class="fa fa-spinner fa-spin"></i>
			{:else}
				<i class="fa fa-magic"></i>
			{/if}
		</div>
	</div>
</div>

<style>
	.experiments-container {
		position: relative;
		width: 70%;
		margin: 0 auto;
	}

	.cta {
		background: rgb(207, 41, 41);
		color: #fff;
		display: block;
		padding: 3em;
		border-radius: 8px;
		text-align: center;
	}

	.cta h1 {
		color: #fff;
	}

	.adder {
		font-size: 72px;
		position: relative;
		display: flex;
		gap: 20px;
		align-items: center;
		justify-content: center;
		margin-top: 30px;
		padding: 20px 0;
	}

	.add-experiment {
		cursor: pointer;
	}

	.wizard-experiment {
		font-size: 36px;
		cursor: pointer;
		color: #9b59b6;
		transition: all 0.3s ease;
	}

	.wizard-experiment:hover:not(.loading) {
		transform: scale(1.1);
		color: #8e44ad;
	}

	.wizard-experiment.loading {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.wizard-experiment .fa-spinner {
		color: #9b59b6;
	}

	.wizard-form {
		background: #f8f9fa;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 20px;
		margin: 20px auto;
		max-width: 600px;
	}

	.wizard-input {
		width: 100%;
		padding: 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		resize: vertical;
		margin-bottom: 12px;
		outline: none;
		box-sizing: border-box;
	}

	.wizard-input:focus {
		border-color: #4a90e2;
		box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
	}

	.run-button {
		width: 100%;
		padding: 12px 24px;
		background: #4a90e2;
		color: #fff;
		border: none;
		border-radius: 6px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.run-button:hover:not(:disabled) {
		background: #357abd;
	}

	.run-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.experiments {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		padding: 20px 0;
	}

	.experiment {
		position: relative;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.experiment span[contenteditable]:first-of-type {
		display: block;
		font-size: 28px;
		font-weight: bold;
		margin-bottom: 15px;
		min-height: 40px;
		outline: none;
	}

	.experiment .body {
		display: block;
		min-height: 100px;
		outline: none;
	}

	.experiment .body :global(p) {
		margin: 0 0 1em 0;
	}
	.experiment .body :global(p:last-child) {
		margin-bottom: 0;
	}
	.experiment .body :global(ul) {
		list-style: disc;
		margin-left: 20px;
		margin-bottom: 1em;
	}
	.experiment .body :global(ol) {
		list-style: decimal;
		margin-left: 20px;
		margin-bottom: 1em;
	}
	.experiment .body :global(li) {
		margin-bottom: 0.5em;
	}
	.experiment .body :global(strong) {
		font-weight: bold;
	}
	.experiment .body :global(em) {
		font-style: italic;
	}
	.experiment .body :global(h1),
	.experiment .body :global(h2),
	.experiment .body :global(h3),
	.experiment .body :global(h4),
	.experiment .body :global(h5),
	.experiment .body :global(h6) {
		font-weight: bold;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}
	.experiment .body :global(h1) {
		font-size: 2em;
	}
	.experiment .body :global(h2) {
		font-size: 1.5em;
	}
	.experiment .body :global(h3) {
		font-size: 1.17em;
	}

	.experiment .fa-trash {
		position: absolute;
		top: 10px;
		right: 10px;
		cursor: pointer;
		color: #dc3545;
		font-size: 24px;
	}

	.experiment .fa-trash:hover {
		color: #c82333;
	}

	@media (max-width: 480px) {
		.experiments-container {
			width: 100%;
		}

		.experiments {
			width: 100%;
		}
	}
</style>
