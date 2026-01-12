<script>
	import ExperimentsMasonry from '$lib/components/Experiments/ExperimentsMasonry.svelte';
</script>

<svelte:head>
	<title>Thought Experiments</title>
	<meta name="description" content="Explore thought experiments across concepts" />
</svelte:head>

<section>
	<h1>Thought Experiments</h1>
	<ExperimentsMasonry />
</section>

<style>
	section {
		padding: 40px 20px;
		min-height: 100vh;
		background: #f5f5f5;
		width: 100%;
		box-sizing: border-box;
		overflow-x: hidden;
	}

	h1 {
		text-align: center;
		font-size: 48px;
		font-weight: 700;
		margin: 0 0 40px 0;
		color: #000;
	}

	@media (max-width: 640px) {
		section {
			padding: 20px 10px;
		}

		h1 {
			font-size: 32px;
			margin-bottom: 24px;
		}
	}
</style>
