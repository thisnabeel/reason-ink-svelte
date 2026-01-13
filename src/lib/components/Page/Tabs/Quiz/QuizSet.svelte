<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api/api.js';
	import { concepts } from '$lib/stores/main';
	import Quiz from './Quiz.svelte';

	export let set;
	export let removeSet;
	export let element;
	export let elementType;

	let quizzes = set.quizzes || [];
	let expanded = false;
	let quizSetConcepts = set.concepts || [];
	let showConceptSearch = false;
	let conceptSearchQuery = '';
	let conceptSearchResults = [];
	let parentConceptId = element.id; // The concept that owns this quiz set

	onMount(async () => {
		// Load concepts if not already loaded
		if ($concepts.length === 0) {
			const response = await Api.get('/concepts.json');
			concepts.set(response);
		}
		// Load quiz_set_concepts if not already in set
		if (!set.concepts || set.concepts.length === 0) {
			await loadQuizSetConcepts();
		} else {
			quizSetConcepts = set.concepts;
		}
	});

	// Reload concepts when expanded
	$: if (expanded && (!set.concepts || set.concepts.length === 0)) {
		loadQuizSetConcepts();
	}

	const loadQuizSetConcepts = async () => {
		const response = await Api.get(`/quiz_set_concepts.json?quiz_set_id=${set.id}`);
		const conceptIds = response.map((qsc) => qsc.concept_id);
		const loadedConcepts = $concepts.filter((c) => conceptIds.includes(c.id));
		quizSetConcepts = loadedConcepts;
		set.concepts = quizSetConcepts;
	};

	const toggleConceptSearch = () => {
		showConceptSearch = !showConceptSearch;
		if (showConceptSearch) {
			conceptSearchQuery = '';
			conceptSearchResults = [];
		}
	};

	const searchConcepts = (query) => {
		if (query.length > 1) {
			const queryUpper = query.toUpperCase();
			const existingConceptIds = quizSetConcepts.map((c) => c.id);
			conceptSearchResults = $concepts.filter(
				(c) =>
					c.title &&
					c.title.toUpperCase().indexOf(queryUpper) > -1 &&
					!existingConceptIds.includes(c.id)
			);
		} else {
			conceptSearchResults = [];
		}
	};

	const addConceptToQuizSet = async (concept) => {
		try {
			const response = await Api.post('/quiz_set_concepts.json', {
				quiz_set_concept: {
					quiz_set_id: set.id,
					concept_id: concept.id
				}
			});
			quizSetConcepts = [...quizSetConcepts, concept];
			set.concepts = quizSetConcepts;
			showConceptSearch = false;
			conceptSearchQuery = '';
		} catch (error) {
			console.error('Error adding concept to quiz set:', error);
		}
	};

	const removeConceptFromQuizSet = async (concept) => {
		// Don't allow removing the parent concept
		if (concept.id === parentConceptId) {
			return;
		}

		try {
			const quizSetConceptsResponse = await Api.get(
				`/quiz_set_concepts.json?quiz_set_id=${set.id}`
			);
			const joinRecord = quizSetConceptsResponse.find(
				(qsc) => qsc.concept_id === concept.id && qsc.quiz_set_id === set.id
			);

			if (joinRecord) {
				await Api.delete(`/quiz_set_concepts/${joinRecord.id}`);
				quizSetConcepts = quizSetConcepts.filter((c) => c.id !== concept.id);
				set.concepts = quizSetConcepts;
			}
		} catch (error) {
			console.error('Error removing concept from quiz set:', error);
		}
	};

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

	const addQuizWithChoices = async () => {
		// Get the last quiz's choices if it exists
		const lastQuiz = quizzes[quizzes.length - 1];

		// Create the new quiz
		const newQuizResponse = await Api.post('/quizzes.json', {
			quiz: {
				quiz_set_id: set.id,
				question: 'New question',
				position: quizzes.length + 1,
				quizable_type: 'Concept',
				quizable_id: element.id
			}
		});

		// If the last quiz has choices, duplicate them
		if (lastQuiz && lastQuiz.quiz_choices && lastQuiz.quiz_choices.length > 0) {
			// Duplicate all choices from the last quiz, setting correct to false
			for (let i = 0; i < lastQuiz.quiz_choices.length; i++) {
				const originalChoice = lastQuiz.quiz_choices[i];
				await Api.post('/quiz_choices.json', {
					quiz_choice: {
						body: originalChoice.body,
						position: i + 1,
						quiz_id: newQuizResponse.id,
						correct: false // All choices start as incorrect
					}
				});
			}
		}

		// Reload the quiz to get the choices (if any were added)
		const updatedQuiz = await Api.get(`/quizzes/${newQuizResponse.id}.json`);
		quizzes = [...quizzes, updatedQuiz];
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

	$: {
		if (showConceptSearch) {
			searchConcepts(conceptSearchQuery);
		}
	}
</script>

<li class="set">
	<div
		class="head"
		on:click={(e) => {
			if (!e.target.closest('.remove') && !e.target.closest('.question-badge')) {
				expanded = !expanded;
			}
		}}
	>
		<span class="content" contenteditable="" on:keyup={(e) => saveTitle(e.target.innerHTML)}
			>{set.title}</span
		>
		<div class="question-badge">
			{quizzes.length}
			{quizzes.length === 1 ? 'question' : 'questions'}
		</div>
	</div>
	{#if expanded}
		<div class="remove" on:click={() => removeSet(set)}>
			<i class="fa fa-trash"></i>
		</div>

		<!-- Concepts Row -->
		<div class="concepts-row">
			{#each quizSetConcepts as concept}
				<div
					class="concept-pill"
					class:undeletable={concept.id === parentConceptId}
					title={concept.title}
				>
					<span class="concept-title">{concept.title}</span>
					{#if concept.id !== parentConceptId}
						<i class="fa fa-times remove-concept" on:click={() => removeConceptFromQuizSet(concept)}
						></i>
					{/if}
				</div>
			{/each}
			<div class="concept-pill add-concept-pill" on:click={toggleConceptSearch}>
				<i class="fa fa-plus"></i>
			</div>
		</div>

		<!-- Concept Search -->
		{#if showConceptSearch}
			<div class="concept-search-wrapper">
				<input
					type="text"
					class="concept-search-input"
					bind:value={conceptSearchQuery}
					placeholder="Search concepts..."
					autofocus
				/>
				{#if conceptSearchResults.length > 0}
					<ul class="concept-search-results">
						{#each conceptSearchResults as concept}
							<li on:click={() => addConceptToQuizSet(concept)}>
								<a href="#" on:click|preventDefault>{concept.title}</a>
							</li>
						{/each}
					</ul>
				{:else if conceptSearchQuery.length > 1}
					<div class="no-results">No concepts found</div>
				{/if}
			</div>
		{/if}

		<div class="quizzes">
			{#each quizzes as quiz}
				<Quiz {quiz} {destroy} />
			{/each}
		</div>
		<div class="adder">
			<div class="add-quiz btn btn-outline-warning" on:click={() => addQuiz()}>+</div>
			<div class="add-quiz-with-choices btn btn-outline-info" on:click={() => addQuizWithChoices()}>
				<i class="fa fa-plus"></i> <i class="fa fa-bullseye"></i>
			</div>
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.head .content {
		outline: none;
		flex: 1;
	}

	.question-badge {
		background: rgba(255, 255, 255, 0.2);
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		white-space: nowrap;
		pointer-events: none;
	}

	.adder {
		padding: 10px;
		font-size: 22px;
		color: #ffd67f;
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.add-quiz {
		font-size: 24px;
		cursor: pointer;
		padding: 0.375rem 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
	}

	.add-quiz-with-choices {
		font-size: 18px;
		cursor: pointer;
		padding: 0.375rem 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.add-quiz-with-choices .fa {
		font-size: 16px;
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

	.concepts-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 12px 20px;
		background: #f8f9fa;
		border-bottom: 1px solid #e0e0e0;
	}

	.concept-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 14px;
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 9999px;
		font-size: 14px;
		color: #333;
		cursor: pointer;
		transition: all 0.2s ease;
		max-width: 200px;
	}

	.concept-pill:hover {
		background: #f0f0f0;
		border-color: #bbb;
	}

	.concept-pill.undeletable {
		background: #e3f2fd;
		border-color: #90caf9;
		cursor: default;
	}

	.concept-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.remove-concept {
		font-size: 12px;
		color: #dc3545;
		cursor: pointer;
		margin-left: 4px;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.remove-concept:hover {
		opacity: 1;
	}

	.add-concept-pill {
		background: #e8f5e9;
		border-color: #81c784;
		color: #2e7d32;
		font-weight: 600;
	}

	.add-concept-pill:hover {
		background: #c8e6c9;
		border-color: #66bb6a;
	}

	.concept-search-wrapper {
		padding: 12px 20px;
		background: #fff;
		border-bottom: 1px solid #e0e0e0;
		position: relative;
	}

	.concept-search-input {
		width: 100%;
		padding: 10px 14px;
		font-size: 14px;
		border: 1px solid #ddd;
		border-radius: 6px;
		outline: none;
		box-sizing: border-box;
	}

	.concept-search-input:focus {
		border-color: #97b1ff;
		box-shadow: 0 0 0 3px rgba(151, 177, 255, 0.1);
	}

	.concept-search-results {
		position: absolute;
		top: 100%;
		left: 20px;
		right: 20px;
		background: #fff;
		border: 1px solid #ddd;
		border-radius: 6px;
		margin-top: 4px;
		padding: 0;
		list-style: none;
		z-index: 1000;
		max-height: 200px;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.concept-search-results li {
		padding: 10px 14px;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.concept-search-results li:last-child {
		border-bottom: none;
	}

	.concept-search-results li:hover {
		background-color: #ffffc7;
	}

	.concept-search-results li a {
		display: block;
		text-decoration: none;
		color: #2a2a2a;
		font-size: 14px;
	}

	.no-results {
		padding: 12px 14px;
		color: #999;
		font-size: 14px;
		text-align: center;
	}
</style>
