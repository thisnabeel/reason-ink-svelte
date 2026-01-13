<script>
	export let element;
	export let elementType;
	import Api from '$lib/api/api/api.js';

	let phrases = element.phrases || [];
	let wizardLoading = false;
	let showWizard = false;
	let wizardPrompt = `give me some 5 one-liners that show up as modern day trickle downs within laymen for the philsophical concepts of ${element.title}. For each phrase, include an explanation of why that phrase was chosen`;

	const addPhrase = async () => {
		const response = await Api.post('/phrases.json', {
			phrase: {
				concept_id: element.id,
				body: 'New phrase'
			}
		});
		phrases = [...phrases, response];
		element.phrases = phrases;
	};

	async function handleRemovePhrase(phrase) {
		await Api.delete(`/phrases/${phrase.id}`);
		phrases = phrases.filter((p) => p.id !== phrase.id);
		element.phrases = phrases;
	}

	let timer;
	const savePhrase = (phrase, field, value) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			await Api.put(`/phrases/${phrase.id}`, {
				phrase: {
					[field]: value
				}
			});
		}, 1000);
	};

	const toggleWizard = () => {
		showWizard = !showWizard;
		if (showWizard) {
			wizardPrompt = `give me some 5 one-liners that show up as modern day trickle downs within laymen for the philsophical concepts of ${element.title}. For each phrase, include an explanation of why that phrase was chosen`;
		}
	};

	const runWizard = async () => {
		if (wizardLoading) return;
		
		wizardLoading = true;
		try {
			const response = await Api.post(`/concepts/${element.id}/generate_phrases.json`, {
				prompt: wizardPrompt
			});
			
			// Add all generated phrases to the list
			phrases = [...phrases, ...response];
			element.phrases = phrases;
			showWizard = false;
		} catch (error) {
			console.error('Error generating phrases with wizard:', error);
			alert('Failed to generate phrases. Please try again.');
		} finally {
			wizardLoading = false;
		}
	};
</script>

<div class="phrases-container">
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

	<ul class="phrases">
		{#if phrases.length > 0}
			{#each phrases as phrase}
				<li class="phrase">
					<span
						contenteditable
						on:keyup={(e) => savePhrase(phrase, 'body', e.target.innerHTML)}>{phrase.body || ''}</span
					>
					<div class="explanation-label">Explanation</div>
					<div
						class="explanation"
						contenteditable
						on:keyup={(e) => savePhrase(phrase, 'explanation', e.target.innerHTML)}>{phrase.explanation || ''}</div
					>
					<span class="fa fa-trash" on:click={() => handleRemovePhrase(phrase)} />
				</li>
			{/each}
		{:else}
			<li>
				<div class="cta">
					<h1>No Phrases Yet.</h1>
				</div>
			</li>
		{/if}
	</ul>

	<div class="adder">
		<div class="add-phrase" on:click={addPhrase}>+</div>
		<div class="wizard-phrase" class:loading={wizardLoading} on:click={toggleWizard}>
			{#if wizardLoading}
				<i class="fa fa-spinner fa-spin"></i>
			{:else}
				<i class="fa fa-magic"></i>
			{/if}
		</div>
	</div>
</div>

<style>
	.phrases-container {
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

	.add-phrase {
		cursor: pointer;
	}

	.wizard-phrase {
		font-size: 36px;
		cursor: pointer;
		color: #9b59b6;
		transition: all 0.3s ease;
	}

	.wizard-phrase:hover:not(.loading) {
		transform: scale(1.1);
		color: #8e44ad;
	}

	.wizard-phrase.loading {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.wizard-phrase .fa-spinner {
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

	.phrases {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		padding: 20px 0;
	}

	.phrase {
		position: relative;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.phrase span[contenteditable] {
		display: block;
		min-height: 50px;
		margin-bottom: 12px;
	}

	.explanation-label {
		font-size: 14px;
		font-weight: 600;
		color: #666;
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.explanation {
		display: block;
		min-height: 60px;
		font-size: 16px;
		color: #555;
		padding: 8px;
		background: #f8f9fa;
		border-radius: 4px;
		outline: none;
	}

	.phrase .fa-trash {
		position: absolute;
		top: 10px;
		right: 10px;
		cursor: pointer;
		color: #dc3545;
		font-size: 24px;
	}

	.phrase .fa-trash:hover {
		color: #c82333;
	}

	@media (max-width: 480px) {
		.phrases-container {
			width: 100%;
		}

		.phrases {
			width: 100%;
		}
	}
</style>
