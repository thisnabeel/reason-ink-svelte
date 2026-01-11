<script>
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import Api from '$lib/api/api/api.js';

	import Concept from '$lib/components/Concepts/Show.svelte';
	import { mapShown, selectConcept, selectedConcept } from '$lib/stores/main';

	let concept;

	onMount(async function () {
		concept = await Api.get('/concepts/' + $page.params.slug);
		console.log('CONCEPT FIND', concept);
	});

	afterNavigate(async function () {
		fetchConcept($page.params.slug);
	});

	const fetchConcept = async (id) => {
		concept = await Api.get('/concepts/' + id);
		mapShown.set(false);
		selectConcept(concept);
		console.log('gotten', concept);
	};
</script>

{#if concept}
	<Concept {concept} />
{/if}

