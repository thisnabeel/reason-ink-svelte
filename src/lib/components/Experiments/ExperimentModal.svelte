<script>
	import { createEventDispatcher } from 'svelte';

	export let selectedExperiment;

	const dispatch = createEventDispatcher();

	const close = () => {
		dispatch('close');
	};

	const handleBackdropClick = (/** @type {any} */ e) => {
		if (e.target === e.currentTarget) {
			close();
		}
	};

	const handleKeydown = (/** @type {any} */ e) => {
		if (e.key === 'Escape') {
			close();
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="modal-backdrop" on:click={handleBackdropClick} role="dialog" aria-modal="true" tabindex="-1">
	<div class="modal-content">
		<button class="close-button" on:click={close} aria-label="Close modal">
			<i class="fa fa-times"></i>
		</button>

		{#if selectedExperiment.conceptTitle}
			<div class="concept-badge">{selectedExperiment.conceptTitle}</div>
		{/if}

		<h2 class="modal-title">{@html selectedExperiment.title || 'Untitled Experiment'}</h2>

		{#if selectedExperiment.body}
			<div class="modal-body">{@html selectedExperiment.body}</div>
		{:else}
			<div class="modal-body empty">No content yet.</div>
		{/if}
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 20px;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: #fff;
		border-radius: 16px;
		padding: 40px;
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		animation: slideUp 0.3s ease;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.close-button {
		position: absolute;
		top: 20px;
		right: 20px;
		background: transparent;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #666;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: #f0f0f0;
		color: #000;
	}

	.concept-badge {
		display: inline-block;
		background: #f0f0f0;
		color: #666;
		font-size: 12px;
		padding: 6px 14px;
		border-radius: 14px;
		margin-bottom: 20px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	.modal-title {
		font-size: 32px;
		font-weight: 700;
		margin: 0 0 24px 0;
		color: #000;
		line-height: 1.2;
		padding-right: 40px;
	}

	.modal-body {
		font-size: 16px;
		line-height: 1.8;
		color: #333;
	}

	.modal-body :global(p) {
		margin: 0 0 16px 0;
	}

	.modal-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.modal-body :global(strong) {
		font-weight: 600;
	}

	.modal-body :global(h2) {
		font-size: 24px;
		font-weight: 700;
		margin: 24px 0 16px 0;
		line-height: 1.3;
	}

	.modal-body :global(h3) {
		font-size: 20px;
		font-weight: 600;
		margin: 20px 0 12px 0;
		line-height: 1.3;
	}

	.modal-body.empty {
		color: #999;
		font-style: italic;
	}

	@media (max-width: 640px) {
		.modal-content {
			padding: 24px;
			margin: 10px;
		}

		.modal-title {
			font-size: 24px;
			padding-right: 30px;
		}

		.modal-body {
			font-size: 14px;
		}
	}
</style>

