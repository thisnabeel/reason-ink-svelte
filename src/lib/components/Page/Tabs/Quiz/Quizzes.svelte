<script>
	export let element;
	export let elementType;
	import Api from '$lib/api/api/api.js';

	import QuizSet from './QuizSet.svelte';

	let quiz_sets = element.quiz_sets || [];

	async function addQuizSet(title = 'Untitled') {
		const res = await Api.post('/quiz_sets.json', {
			quiz_set: {
				quiz_setable_id: element.id,
				quiz_setable_type: 'Concept',
				position: quiz_sets.length + 1,
				title: title
			}
		});
		console.log({ res });
		quiz_sets = [...quiz_sets, res];
		element.quiz_sets = quiz_sets;
	}

	async function removeSet(payload) {
		console.log({ payload });
		const res = await Api.delete(`/quiz_sets/${payload.id}`);
		quiz_sets = quiz_sets.filter((s) => s.id !== payload.id);
		element.quiz_sets = quiz_sets;
	}

	const suggestedTitles = ['General', 'Jeopardy', 'Scenarios', 'Use Cases', 'Differences', 'Asks'];
</script>

<div class="quiz_sets">
	<ul class="clean-list">
		{#each quiz_sets as set}
			<QuizSet {element} set={set} {removeSet} {elementType} />
		{/each}
	</ul>

	<div class="adder">
		<div class="add-quiz btn btn-outline-warning" on:click={() => addQuizSet()}>+</div>
	</div>
	<div class="adder flex" style="width: 100%; overflow-x: scroll;">
		{#each suggestedTitles.filter((t) => !quiz_sets.map((s) => s.title).includes(t)) as title}
			<div class="">
				<div class="btn btn-outline-warning btn-block" on:click={() => addQuizSet(title)}>
					{title}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.quiz_sets {
		margin-top: 10px;
	}
	.adder {
		font-size: 22px;
		color: #ffd67f;
		display: flex;
	}

	.adder > div {
		flex: 1;
		text-align: center;
		margin: 1px;
	}

	.add-quiz {
		font-size: 24px;
		cursor: pointer;
	}

	.clean-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.flex {
		display: flex;
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

	.btn-outline-warning {
		color: #856404;
		background-color: transparent;
		border-color: #ffc107;
	}

	.btn-outline-warning:hover {
		color: #212529;
		background-color: #ffc107;
		border-color: #ffc107;
	}

	.btn-block {
		display: block;
		width: 100%;
	}

	@media (max-width: 480px) {
		.quiz_sets {
			width: 95%;
		}
	}
</style>
