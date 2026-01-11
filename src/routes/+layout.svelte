<script>
	import Header from './Header.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import './layout.css';

	/** @type {{children: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<div class="app">
	<Header />
	<div class="search-container">
		<SearchBar />
	</div>

	<main>
		{@render children()}
	</main>
	<!-- 
	<footer>
		<p>
			visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
		</p>
	</footer> -->
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.search-container {
		width: 100%;
		background: #fff;
		padding: 3rem 0 2.5rem 0;
		box-sizing: border-box;
		border-bottom: 1px solid rgba(229, 71, 69, 0.1);
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
