<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import Api from '$lib/api/api/api.js';
	import ChapterShow from '$lib/components/Chapters/Show.svelte';
	import { selectChapter } from '$lib/stores/main';

	let chapter;

	onMount(async function () {
		chapter = await Api.get('/chapters/' + $page.params.slug + '.json');
	});

	afterNavigate(async function () {
		chapter = await Api.get('/chapters/' + $page.params.slug + '.json');
		selectChapter(chapter);
	});
</script>

{#if chapter}
	<ChapterShow {chapter} />
{/if}

