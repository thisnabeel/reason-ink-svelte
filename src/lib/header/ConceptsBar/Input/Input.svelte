<script>
	import { concepts, selectConcept } from '$lib/stores/main';
	import { goto } from '$app/navigation';

	let input;

	let showResults = false;

	let items;
	let results;
	let query = '';
	let select;

	export let type;

	if (type === 'Concepts') {
		concepts.subscribe((value) => {
			items = value.filter((item) => item.concept_id != null);
		});
		select = selectConcept;
	}

	const handleInputClick = () => {
		if (query.length > 0) return;

		let randomItems = [];
		while (randomItems.length < 6 && $concepts.length > 0) {
			const randomElement = $concepts[Math.floor(Math.random() * $concepts.length)];
			if (randomItems.indexOf(randomElement) > -1) {
				continue;
			}
			randomItems.push(randomElement);
		}

		showResults = true;
		results = randomItems;
	};

	const search = (query) => {
		if (query.length > 0 && query.length < 2) {
			showResults = false;
		} else if (query.length > 1) {
			showResults = true;
			results = $concepts.filter(
				(item) => item.title.toUpperCase().indexOf(query.toUpperCase()) > -1
			);
		}
	};

	const handleSelect = (item) => {
		goto(`/concepts/${item.id}`);
	};

	$: {
		search(query);
	}
</script>

<div class="wrapper {type}">
	<input
		type="text"
		on:click={() => handleInputClick()}
		bind:value={query}
		on:blur={() =>
			setTimeout(function () {
				showResults = false;
			}, 50)}
		placeholder="Search {type}..."
	/>
	{#if results && showResults}
		<ul>
			{#each results as item}
				<li id={item.id}><a href="/concepts/{item.id}">{item.title}</a></li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.wrapper {
		position: relative;
	}

	ul {
		padding: 10px;
		background: #fff;
		font-size: 22px;
		position: absolute;
		top: 78px;
		width: 100%;
		border: 2px solid #5f4a4a;
		z-index: 999;
		list-style: none;
	}

	@media (max-width: 480px) {
		ul {
			width: 95vw;
		}

		.Concepts ul {
			position: absolute;
			right: -12px;
		}
	}

	ul li {
		padding: 10px;
		border-bottom: 1px solid #ccc;
		position: relative;
	}

	ul li:hover {
		background-color: #ffffc7;
	}

	input {
		padding: 20px;
		font-size: 24px;
		border: 1px solid #e9e1e2;
		margin-bottom: 10px;
		background: #efefef;
		width: 100%;
	}

	input:hover {
		background: #eaf7ff;
	}
</style>

