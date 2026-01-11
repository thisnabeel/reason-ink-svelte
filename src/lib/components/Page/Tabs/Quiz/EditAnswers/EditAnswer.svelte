<script>
	import Api from '$lib/api/api/api.js';

	export let quiz;

	let quiz_choices = quiz.quiz_choices || [];

	async function addChoice() {
		const response = await Api.post('/quiz_choices.json', {
			quiz_choice: {
				body: 'New choice',
				position: quiz_choices.length + 1,
				quiz_id: quiz.id,
				correct: false
			}
		});
		quiz_choices = [...quiz_choices, response];
		quiz.quiz_choices = quiz_choices;
	}

	async function toggleCorrect(choice) {
		const response = await Api.put(`/quiz_choices/${choice.id}`, {
			quiz_choice: {
				correct: !choice.correct
			}
		});
		choice.correct = response.correct;
		quiz_choices = [...quiz_choices];
		quiz.quiz_choices = quiz_choices;
	}

	async function removeChoice(choice) {
		await Api.delete(`/quiz_choices/${choice.id}`);
		quiz_choices = quiz_choices.filter((c) => c.id !== choice.id);
		quiz.quiz_choices = quiz_choices;
	}

	let timer;
	const saveChoice = (choice, body) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			await Api.put(`/quiz_choices/${choice.id}`, {
				quiz_choice: {
					body: body
				}
			});
		}, 1000);
	};
</script>

{#each quiz_choices as choice}
	<li class="choice">
		<span
			contenteditable
			on:keyup={(e) => saveChoice(choice, e.target.innerHTML)}>{choice.body || ''}</span
		>
		<i
			class="fa fa-circle toggle-correct"
			class:correct={choice.correct}
			on:click={() => toggleCorrect(choice)}
		/>
		<i class="fa fa-times remove-choice" on:click={() => removeChoice(choice)} />
	</li>
{/each}

<div class="adder">
	<div class="btn btn-outline-info btn-block" on:click={addChoice}>
		<i class="fa fa-plus"></i> Add Choice
	</div>
</div>

<style>
	.choice {
		position: relative;
		padding: 10px;
		margin: 5px 0;
		border: 1px solid #ddd;
		border-radius: 4px;
		list-style: none;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.choice span[contenteditable] {
		flex: 1;
		outline: none;
		min-height: 30px;
	}

	.toggle-correct {
		font-size: 24px;
		cursor: pointer;
		color: #6c757d;
	}

	.toggle-correct.correct {
		color: #28a745;
	}

	.remove-choice {
		font-size: 24px;
		cursor: pointer;
		color: #dc3545;
	}

	.remove-choice:hover {
		color: #c82333;
	}

	.adder {
		margin-top: 10px;
	}

	.btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: 400;
		text-align: center;
		white-space: nowrap;
		user-select: none;
	}

	.btn-outline-info {
		color: #17a2b8;
		background-color: transparent;
		border-color: #17a2b8;
	}

	.btn-outline-info:hover {
		color: #fff;
		background-color: #17a2b8;
		border-color: #17a2b8;
	}

	.btn-block {
		display: block;
		width: 100%;
	}
</style>

