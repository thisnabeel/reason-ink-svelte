<script>
	export let element;
	export let elementType;
	import Api from '$lib/api/api/api.js';

	let examples = element.examples || [];
	let wizardLoading = false;
	let showWizard = false;
	let wizardPrompt = `Generate an example for the concept '${element.title}'. The example should be concise and practical, with a maximum of 250 characters. Return json format: {title: "the title of the example", body: "the body content of the example with HTML formatting for paragraphs and emphasis"}`;

	const addExample = async () => {
		const response = await Api.post('/examples.json', {
			example: {
				concept_id: element.id,
				title: 'New Example',
				body: ''
			}
		});
		examples = [...examples, response];
		element.examples = examples;
	};

	const toggleWizard = () => {
		showWizard = !showWizard;
		if (showWizard) {
			wizardPrompt = `Generate an example for the concept '${element.title}'. The example should be concise and practical, with a maximum of 250 characters. Return json format: {title: "the title of the example", body: "the body content of the example with HTML formatting for paragraphs and emphasis"}`;
		}
	};

	const runWizard = async () => {
		if (wizardLoading) return; // Prevent multiple simultaneous requests
		
		wizardLoading = true;
		try {
			// Generate example using wizard AI
			const exampleResponse = await Api.post(`/concepts/${element.id}/generate_example.json`, {
				prompt: wizardPrompt
			});
			
			examples = [...examples, exampleResponse];
			element.examples = examples;
			showWizard = false;
		} catch (error) {
			console.error('Error generating example with wizard:', error);
			alert('Failed to generate example. Please try again.');
		} finally {
			wizardLoading = false;
		}
	};

	async function handleRemoveExample(example) {
		await Api.delete(`/examples/${example.id}`);
		examples = examples.filter((e) => e.id !== example.id);
		element.examples = examples;
	}

	let timer;
	const saveExample = (example, field, value) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			await Api.put(`/examples/${example.id}`, {
				example: {
					[field]: value
				}
			});
		}, 1000);
	};
</script>

<div class="examples-container">
	<ul class="examples">
		{#if examples.length > 0}
			{#each examples as example}
				<li class="example">
					<span
						contenteditable
						on:keyup={(e) => saveExample(example, 'title', e.target.innerHTML)}>{@html example.title || ''}</span
					>
					<div
						class="body"
						contenteditable
						on:keyup={(e) => saveExample(example, 'body', e.target.innerHTML)}>{@html example.body || ''}</div
					>
					<span class="fa fa-trash" on:click={() => handleRemoveExample(example)} />
				</li>
			{/each}
		{:else}
			<li>
				<div class="cta">
					<h1>No Examples Yet.</h1>
				</div>
			</li>
		{/if}
	</ul>

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

	<div class="adder">
		<div class="add-example" on:click={addExample}>+</div>
		<div class="wizard-example" class:loading={wizardLoading} on:click={toggleWizard}>
			{#if wizardLoading}
				<i class="fa fa-spinner fa-spin"></i>
			{:else}
				<i class="fa fa-magic"></i>
			{/if}
		</div>
	</div>
</div>

<style>
	.examples-container {
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

	.add-example {
		cursor: pointer;
	}

	.wizard-example {
		font-size: 36px;
		cursor: pointer;
		color: #9b59b6;
		transition: all 0.3s ease;
	}

	.wizard-example:hover:not(.loading) {
		transform: scale(1.1);
		color: #8e44ad;
	}

	.wizard-example.loading {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.wizard-example .fa-spinner {
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

	.examples {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		padding: 20px 0;
	}

	.example {
		position: relative;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.example span[contenteditable]:first-of-type {
		display: block;
		font-size: 28px;
		font-weight: bold;
		margin-bottom: 15px;
		min-height: 40px;
		outline: none;
	}

	.example .body {
		display: block;
		min-height: 100px;
		outline: none;
	}

	.example .body :global(p) {
		margin: 0 0 1em 0;
	}
	.example .body :global(p:last-child) {
		margin-bottom: 0;
	}
	.example .body :global(ul) {
		list-style: disc;
		margin-left: 20px;
		margin-bottom: 1em;
	}
	.example .body :global(ol) {
		list-style: decimal;
		margin-left: 20px;
		margin-bottom: 1em;
	}
	.example .body :global(li) {
		margin-bottom: 0.5em;
	}
	.example .body :global(strong) {
		font-weight: bold;
	}
	.example .body :global(em) {
		font-style: italic;
	}
	.example .body :global(h1),
	.example .body :global(h2),
	.example .body :global(h3),
	.example .body :global(h4),
	.example .body :global(h5),
	.example .body :global(h6) {
		font-weight: bold;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}
	.example .body :global(h1) {
		font-size: 2em;
	}
	.example .body :global(h2) {
		font-size: 1.5em;
	}
	.example .body :global(h3) {
		font-size: 1.17em;
	}

	.example .fa-trash {
		position: absolute;
		top: 10px;
		right: 10px;
		cursor: pointer;
		color: #dc3545;
		font-size: 24px;
	}

	.example .fa-trash:hover {
		color: #c82333;
	}

	@media (max-width: 480px) {
		.examples-container {
			width: 100%;
		}

		.examples {
			width: 100%;
		}
	}
</style>

