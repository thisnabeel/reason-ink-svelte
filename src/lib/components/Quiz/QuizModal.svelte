<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Api from '$lib/api/api/api.js';

	const dispatch = createEventDispatcher();

	let allQuizzes: any[] = [];
	let sampledQuizzes: any[] = [];
	let currentQuestionIndex = 0;
	let selectedChoiceId: number | null = null;
	let showResult = false;
	let score = 0;
	let totalQuestions = 0;
	let loading = true;
	let quizComplete = false;
	let currentShuffledChoices: any[] = [];

	onMount(async () => {
		await loadQuizzes();
	});

	const loadQuizzes = async () => {
		try {
			// Fetch all quizzes directly
			const allQuizzesResponse = await Api.get('/quizzes.json');
			
			// Fetch choices for each quiz and filter out quizzes without choices
			const quizzesWithChoices: any[] = [];
			
			for (const quiz of allQuizzesResponse) {
				try {
					const fullQuiz = await Api.get(`/quizzes/${quiz.id}.json`);
					if (fullQuiz.quiz_choices && fullQuiz.quiz_choices.length > 0) {
						quizzesWithChoices.push(fullQuiz);
					}
				} catch (error) {
					console.error(`Error fetching quiz ${quiz.id}:`, error);
				}
			}

			allQuizzes = quizzesWithChoices;
			
			// Sample 10 random quizzes (or all if less than 10)
			const sampleSize = Math.min(10, allQuizzes.length);
			sampledQuizzes = shuffleArray([...allQuizzes]).slice(0, sampleSize);
			totalQuestions = sampledQuizzes.length;
			
			// Initialize shuffled choices for the first question
			if (sampledQuizzes.length > 0 && sampledQuizzes[0].quiz_choices) {
				currentShuffledChoices = shuffleChoices(sampledQuizzes[0].quiz_choices);
			}
			
			loading = false;
		} catch (error) {
			console.error('Error loading quizzes:', error);
			loading = false;
		}
	};

	const shuffleArray = (array: any[]) => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	};

	const shuffleChoices = (choices: any[]) => {
		return shuffleArray([...choices]);
	};

	const handleChoiceSelect = (choiceId: number) => {
		if (showResult) return;
		selectedChoiceId = choiceId;
	};

	const submitAnswer = () => {
		if (selectedChoiceId === null) return;

		const currentQuiz = sampledQuizzes[currentQuestionIndex];
		const selectedChoice = currentQuiz.quiz_choices.find(
			(c: any) => c.id === selectedChoiceId
		);

		showResult = true;
		if (selectedChoice && selectedChoice.correct) {
			score++;
		}
	};

	const nextQuestion = () => {
		if (currentQuestionIndex < sampledQuizzes.length - 1) {
			currentQuestionIndex++;
			selectedChoiceId = null;
			showResult = false;
			// Shuffle choices for the new question
			const currentQuiz = sampledQuizzes[currentQuestionIndex];
			if (currentQuiz && currentQuiz.quiz_choices) {
				currentShuffledChoices = shuffleChoices(currentQuiz.quiz_choices);
			}
		} else {
			quizComplete = true;
		}
	};

	const closeModal = () => {
		dispatch('close');
	};

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			closeModal();
		}
	};

	const resetQuiz = async () => {
		await loadQuizzes();
		currentQuestionIndex = 0;
		selectedChoiceId = null;
		showResult = false;
		score = 0;
		quizComplete = false;
		// Shuffle choices for the first question
		if (sampledQuizzes.length > 0 && sampledQuizzes[0].quiz_choices) {
			currentShuffledChoices = shuffleChoices(sampledQuizzes[0].quiz_choices);
		}
	};

	$: currentQuiz = sampledQuizzes[currentQuestionIndex];
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="modal-backdrop"
	on:click={handleBackdropClick}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div class="modal-content">
		<button class="close-button" on:click={closeModal} aria-label="Close modal">
			<i class="fa fa-times"></i>
		</button>

		{#if loading}
			<div class="loading">Loading quiz questions...</div>
		{:else if quizComplete}
			<div class="quiz-complete">
				<h2>Quiz Complete!</h2>
				<div class="score">
					You scored {score} out of {totalQuestions}
				</div>
				<div class="score-percentage">
					{Math.round((score / totalQuestions) * 100)}%
				</div>
				<button class="restart-button" on:click={resetQuiz}>Try Again</button>
				<button class="close-quiz-button" on:click={closeModal}>Close</button>
			</div>
		{:else if currentQuiz}
			<div class="quiz-container">
				<div class="quiz-header">
					<div class="question-counter">
						Question {currentQuestionIndex + 1} of {totalQuestions}
					</div>
					<div class="score-display">Score: {score}/{currentQuestionIndex}</div>
				</div>

				<div class="question-section">
					<h2 class="question-text">{@html currentQuiz.question || 'No question'}</h2>
				</div>

				<div class="choices-section">
					{#each currentShuffledChoices as choice}
						<button
							class="choice-button"
							class:selected={selectedChoiceId === choice.id}
							class:correct={showResult && choice.correct}
							class:incorrect={showResult && selectedChoiceId === choice.id && !choice.correct}
							on:click={() => handleChoiceSelect(choice.id)}
							disabled={showResult}
						>
							{@html choice.body || ''}
							{#if showResult && choice.correct}
								<i class="fa fa-check correct-icon"></i>
							{:else if showResult && selectedChoiceId === choice.id && !choice.correct}
								<i class="fa fa-times incorrect-icon"></i>
							{/if}
						</button>
					{/each}
				</div>

				<div class="quiz-actions">
					{#if !showResult}
						<button
							class="submit-button"
							on:click={submitAnswer}
							disabled={selectedChoiceId === null}
						>
							Submit Answer
						</button>
					{:else}
						<button class="next-button" on:click={nextQuestion}>
							{currentQuestionIndex < sampledQuizzes.length - 1 ? 'Next Question' : 'Finish Quiz'}
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="no-quizzes">
				<h2>No quizzes available</h2>
				<p>There are no quiz questions with choices available.</p>
				<button class="close-quiz-button" on:click={closeModal}>Close</button>
			</div>
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
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
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
		max-width: 800px;
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

	.loading,
	.no-quizzes {
		text-align: center;
		padding: 60px 20px;
	}

	.quiz-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.quiz-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 16px;
		border-bottom: 2px solid #e0e0e0;
	}

	.question-counter {
		font-size: 16px;
		color: #666;
		font-weight: 600;
	}

	.score-display {
		font-size: 16px;
		color: #666;
		font-weight: 600;
	}

	.question-section {
		margin: 20px 0;
	}

	.question-text {
		font-size: 24px;
		font-weight: 700;
		color: #000;
		line-height: 1.4;
		margin: 0;
	}

	.choices-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin: 20px 0;
	}

	.choice-button {
		padding: 16px 20px;
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 18px;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		color: #333;
	}

	.choice-button:hover:not(:disabled) {
		background: #e9ecef;
		border-color: #97b1ff;
		transform: translateX(4px);
	}

	.choice-button.selected {
		background: #e3f2fd;
		border-color: #97b1ff;
	}

	.choice-button.correct {
		background: #d4edda;
		border-color: #28a745;
		color: #155724;
	}

	.choice-button.incorrect {
		background: #f8d7da;
		border-color: #dc3545;
		color: #721c24;
	}

	.choice-button:disabled {
		cursor: not-allowed;
	}

	.correct-icon {
		color: #28a745;
		font-size: 20px;
	}

	.incorrect-icon {
		color: #dc3545;
		font-size: 20px;
	}

	.quiz-actions {
		display: flex;
		justify-content: center;
		margin-top: 24px;
	}

	.submit-button,
	.next-button,
	.restart-button,
	.close-quiz-button {
		padding: 14px 32px;
		font-size: 18px;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.submit-button {
		background: #416fff;
		color: #fff;
	}

	.submit-button:hover:not(:disabled) {
		background: #3555cc;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(65, 111, 255, 0.3);
	}

	.submit-button:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.next-button {
		background: #28a745;
		color: #fff;
	}

	.next-button:hover {
		background: #218838;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
	}

	.quiz-complete {
		text-align: center;
		padding: 40px 20px;
	}

	.quiz-complete h2 {
		font-size: 32px;
		margin-bottom: 24px;
		color: #000;
	}

	.score {
		font-size: 24px;
		margin-bottom: 12px;
		color: #666;
	}

	.score-percentage {
		font-size: 48px;
		font-weight: 700;
		color: #416fff;
		margin-bottom: 32px;
	}

	.restart-button {
		background: #416fff;
		color: #fff;
		margin-right: 12px;
	}

	.restart-button:hover {
		background: #3555cc;
	}

	.close-quiz-button {
		background: #6c757d;
		color: #fff;
	}

	.close-quiz-button:hover {
		background: #5a6268;
	}

	@media (max-width: 640px) {
		.modal-content {
			padding: 24px;
			margin: 10px;
		}

		.question-text {
			font-size: 20px;
		}

		.choice-button {
			font-size: 16px;
			padding: 14px 16px;
		}
	}
</style>

