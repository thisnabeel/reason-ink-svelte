<script>
	import Api from '$lib/api/api/api.js';
	import Quiz from './Quiz.svelte';

	export let set;
	export let removeSet;
	export let element;
	export let elementType;

	let quizzes = set.quizzes || [];
	let expanded = false;

	const addQuiz = async () => {
		const response = await Api.post('/quizzes.json', {
			quiz: {
				quiz_set_id: set.id,
				question: 'New question',
				position: quizzes.length + 1,
				quizable_type: 'Concept',
				quizable_id: element.id
			}
		});

		quizzes = [...quizzes, response];
		set.quizzes = quizzes;
	};

	const destroy = async (quiz) => {
		await Api.delete(`/quizzes/${quiz.id}`);
		quizzes = quizzes.filter((q) => q.id !== quiz.id);
		set.quizzes = quizzes;
	};

	let timer;
	const saveTitle = (title) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			await Api.put(`/quiz_sets/${set.id}`, {
				quiz_set: {
					title: title
				}
			});
		}, 1000);
	};
</script>

<li class="set">
	<div
		class="head"
		on:click={(e) => {
			if (!e.target.closest('.remove')) {
				expanded = !expanded;
			}
		}}
	>
		<span
			class="content"
			contenteditable=""
			on:keyup={(e) => saveTitle(e.target.innerHTML)}>{set.title}</span
		>
	</div>
	{#if expanded}
		<div class="remove" on:click={() => removeSet(set)}>
			<i class="fa fa-trash"></i>
		</div>
		<div class="adder">
			<div class="add-quiz btn btn-outline-warning" on:click={() => addQuiz()}>+</div>
		</div>
		<div class="quizzes">
			{#each quizzes as quiz}
				<Quiz {quiz} {destroy} />
			{/each}
		</div>
	{/if}
</li>

<style>
	.remove {
		position: absolute;
		top: 10px;
		left: -40px;
		color: #dc3545;
		font-size: 24px;
		cursor: pointer;
	}

	.set {
		margin-bottom: 6px;
		background: aliceblue;
		position: relative;
		list-style: none;
	}

	.head {
		background: #0e3f86;
		padding: 20px;
		color: #fff;
		border-radius: 4px;
		margin-bottom: 4px;
		font-size: 24px;
		position: sticky;
		top: 0;
		z-index: 999;
		cursor: pointer;
	}

	.head .content {
		outline: none;
	}

	.adder {
		padding: 10px;
		font-size: 22px;
		color: #ffd67f;
		display: flex;
	}

	.add-quiz {
		font-size: 24px;
		cursor: pointer;
		padding: 0.375rem 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
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

	.quizzes {
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
</style>

