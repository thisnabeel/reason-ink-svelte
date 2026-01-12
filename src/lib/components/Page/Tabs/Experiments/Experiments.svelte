<script>
	export let element;
	export let elementType;
	import Api from '$lib/api/api/api.js';

	let experiments = element.experiments || [];
	let wizardLoading = false;

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

	const generateWithWizard = async () => {
		if (wizardLoading) return; // Prevent multiple simultaneous requests
		
		wizardLoading = true;
		try {
			// Generate experiment using wizard AI
			const experimentResponse = await Api.post(`/concepts/${element.id}/generate_experiment.json`);
			
			// The experiment is already linked to the concept by the backend
			experiments = [...experiments, experimentResponse];
			element.experiments = experiments;
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

<ul class="experiments">
	{#if experiments.length > 0}
		{#each experiments as experiment}
			<li class="experiment">
				<span
					contenteditable
					on:keyup={(e) => saveExperiment(experiment, 'title', e.target.innerHTML)}>{experiment.title || ''}</span
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
		<div class="cta">
			<h1>No Experiments Yet.</h1>
		</div>
	{/if}
	<div class="adder">
		<div class="add-experiment" on:click={addExperiment}>+</div>
		<div class="wizard-experiment" class:loading={wizardLoading} on:click={generateWithWizard}>
			{#if wizardLoading}
				<i class="fa fa-spinner fa-spin"></i>
			{:else}
				<i class="fa fa-magic"></i>
			{/if}
		</div>
	</div>
</ul>

<style>
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

	.experiments {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
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
	}

	.experiment .body {
		display: block;
		min-height: 100px;
	}

	.experiment .body :global(p) {
		margin: 0 0 12px 0;
	}

	.experiment .body :global(p:last-child) {
		margin-bottom: 0;
	}

	.experiment .body :global(ul),
	.experiment .body :global(ol) {
		margin: 12px 0;
		padding-left: 24px;
	}

	.experiment .body :global(li) {
		margin: 6px 0;
	}

	.experiment .body :global(em),
	.experiment .body :global(strong) {
		font-weight: 600;
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
		.experiments {
			width: 100%;
		}
	}
</style>

