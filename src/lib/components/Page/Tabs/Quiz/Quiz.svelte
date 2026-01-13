<script>
	import Api from '$lib/api/api/api.js';
	import EditAnswer from './EditAnswers/EditAnswer.svelte';

	export let quiz;
	export let destroy;

	let timer;
	let showChoices = false;

	const debounce = (v) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const response = await Api.put(`/quizzes/${quiz.id}`, {
				quiz: {
					question: v
				}
			});
			console.log('response', response);
		}, 1000);
	};
</script>

<li class="quiz">
	<span contenteditable on:keyup={(e) => debounce(e.target.innerHTML)}>{@html quiz.question || ''}</span>
	<span class="fa fa-trash" on:click={() => destroy(quiz)} />

	<hr />
	<EditAnswer {quiz} />

	{#if !showChoices && quiz.quiz_choices && quiz.quiz_choices.length > 0}
		<div class="btn btn-info" on:click={() => (showChoices = !showChoices)}>
			{#if quiz.quiz_choices.length > 1}
				Show Choices
			{:else}
				Show Answer
			{/if}
		</div>
	{/if}

	{#if showChoices}
		<div class="btn btn-info" on:click={() => (showChoices = !showChoices)}>
			{#if quiz.quiz_choices.length > 1}
				Hide Choices
			{:else}
				Hide Answer
			{/if}
		</div>
		<div class="choices">
			{#each quiz.quiz_choices || [] as choice}
				<div class="choice" class:correct={choice.correct}>
					{choice.body}
				</div>
			{/each}
		</div>
	{/if}
</li>

<style>
	.quiz {
		position: relative;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
		list-style: none;
	}

	.quiz span[contenteditable] {
		display: block;
		min-height: 50px;
		outline: none;
	}

	.quiz .fa-trash {
		position: absolute;
		top: 10px;
		right: 10px;
		cursor: pointer;
		color: #dc3545;
		font-size: 24px;
	}

	.quiz .fa-trash:hover {
		color: #c82333;
	}

	.choices {
		margin-top: 20px;
	}

	.choice {
		padding: 10px;
		margin: 5px 0;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #f8f9fa;
	}

	.choice.correct {
		background: #d4edda;
		border-color: #c3e6cb;
	}

	.btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		cursor: pointer;
		margin-top: 10px;
		display: inline-block;
	}

	.btn-info {
		color: #fff;
		background-color: #17a2b8;
		border-color: #17a2b8;
	}

	.btn-info:hover {
		background-color: #138496;
		border-color: #117a8b;
	}

	hr {
		margin: 20px 0;
		border: 0;
		border-top: 1px solid #ddd;
	}
</style>
