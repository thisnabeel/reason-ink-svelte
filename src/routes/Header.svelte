<script>
	import { resolve } from '$app/paths';
	import QuizModal from '$lib/components/Quiz/QuizModal.svelte';

	let showQuizModal = false;

	const toggleQuizModal = () => {
		showQuizModal = !showQuizModal;
	};
</script>

<header>
	<!-- Top-left: Newspaper/News icon button and Controller button -->
	<div class="nav-buttons-left">
		<button class="nav-button" aria-label="News">
			<i class="fa fa-newspaper"></i>
		</button>
		<button class="nav-button" aria-label="Quiz" on:click={toggleQuizModal}>
			<i class="fa fa-gamepad"></i>
		</button>
	</div>

	<!-- Center: Yasbahoon Logo/Title with Binoculars -->
	<div class="logo-container">
		<a href={resolve('/')} class="logo-link">
			<img src="/logo-light.png" alt="Yasbahoon" class="logo-img" />
		</a>
	</div>

	<!-- Top-right: Book and User icon buttons -->
	<div class="nav-buttons-right">
		<button class="nav-button" aria-label="Book">
			<i class="fa fa-book"></i>
		</button>
		<button class="nav-button" aria-label="User">
			<i class="fa fa-user"></i>
		</button>
	</div>
</header>

{#if showQuizModal}
	<QuizModal on:close={() => (showQuizModal = false)} />
{/if}

<style>
	header {
		position: relative;
		background: #fff; /* Light pink background */
		padding: 2em 1em;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		box-sizing: border-box;
		min-height: 120px;
	}

	.nav-button {
		background: #fff;
		border-radius: 100%;
		height: 50px;
		width: 50px;
		border: none;
		cursor: pointer;
		position: relative;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.nav-button:active {
		transform: scale(0.95);
	}

	.nav-button .fa {
		position: absolute;
		font-size: 20px;
		color: #97b1ff;
	}

	.nav-buttons-left {
		position: absolute;
		top: 40px;
		left: 30px;
		display: flex;
		gap: 10px;
	}

	.nav-buttons-left .nav-button .fa {
		top: 28%;
		left: 30%;
	}

	.nav-buttons-right {
		position: absolute;
		top: 40px;
		right: 30px;
		display: flex;
		gap: 10px;
	}

	.nav-buttons-right .nav-button .fa {
		top: 28%;
		left: 32%;
	}

	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
	}

	.logo-link {
		display: block;
		text-decoration: none;
	}

	.logo-img {
		max-width: 450px;
		width: 100%;
		height: auto;
		margin-top: 10px;
	}

	@media (max-width: 768px) {
		header {
			padding: 1.5em 0.5em;
			min-height: 100px;
		}

		.nav-button {
			height: 40px;
			width: 40px;
		}

		.nav-button .fa {
			font-size: 18px;
		}

		.nav-buttons-left {
			top: 20px;
			left: 20px;
			gap: 8px;
		}

		.nav-buttons-right {
			top: 20px;
			right: 20px;
			gap: 8px;
		}

		.logo-img {
			max-width: 300px;
		}
	}
</style>
