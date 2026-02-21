<script>
	import { goto } from '$app/navigation';
	import { selectedChapter, selectChapter } from '$lib/stores/main';

	export let item;
	export let type;
	export let removeChapter;

	// Out-loud read time: same as typewriter (150 WPM)
	const WPM_OUTLOUD = 150;

	function wordCount(body) {
		if (!body || typeof body !== 'string') return 0;
		const text = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
		return text ? text.split(' ').filter(Boolean).length : 0;
	}

	function formatReadTime(totalSeconds) {
		if (totalSeconds <= 0 || !Number.isFinite(totalSeconds)) return null;
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = Math.floor(totalSeconds % 60);
		const parts = [];
		if (h > 0) parts.push(h + 'h');
		if (m > 0 || h > 0) parts.push((m < 10 && h > 0 ? '0' : '') + m + 'm');
		if (s > 0 || (h === 0 && m === 0)) parts.push((s < 10 && (h > 0 || m > 0) ? '0' : '') + s + 's');
		return parts.join(' ');
	}

	$: words = wordCount(item.body);
	$: readTimeSeconds = (words / WPM_OUTLOUD) * 60;
	$: readTimeLabel = formatReadTime(readTimeSeconds);

	function handleChapterClick() {
		if ($selectedChapter && $selectedChapter.id === item.id) {
			selectChapter(null);
		} else {
			selectChapter(item);
		}
	}

	function handleLinkClick() {
		goto('/chapters/' + item.id);
	}
</script>

<li class="chapter" class:selected={$selectedChapter && item.id === $selectedChapter.id}>
	<div class="chapter-info" on:click={handleChapterClick}>
		<span class="title">{item.title || 'Untitled Chapter'}</span>
		{#if readTimeLabel}
			<span class="read-time" title="Read aloud">{readTimeLabel}</span>
		{/if}
	</div>
	{#if $selectedChapter && item.id === $selectedChapter.id}
		<i
			class="fa fa-link link-btn"
			on:click={handleLinkClick}
			title="View chapter"
		></i>
		{#if removeChapter}
			<i
				class="fa fa-trash delete-btn"
				on:click={() => removeChapter(item)}
				title="Delete chapter"
			></i>
		{/if}
	{/if}

	{#each item.child_chapters || [] as childChapter}
		<svelte:self item={childChapter} {type} {removeChapter} />
	{/each}
</li>

<style>
	.chapter {
		position: relative;
		margin-left: 10px;
		border-left: 6px solid #ffeaa7;
		font-size: 18px;
		margin-bottom: 0;
		padding-left: 12px;
		cursor: pointer;
	}

	.chapter:hover {
		border-left: 6px #416fff solid;
	}

	.selected {
		background: rgb(199, 199, 255);
	}

	.chapter-info {
		width: 100%;
		padding: 14px;
		display: block;
	}

	.title {
		display: inline;
		font-size: 28px;
	}

	.read-time {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.2em 0.6em;
		font-size: 0.75rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: #5a6268;
		letter-spacing: 0.02em;
		background: #e9ecef;
		border-radius: 9999px;
	}

	.read-time::before {
		content: none;
	}

	.link-btn,
	.delete-btn {
		display: none;
		color: #ccc;
		position: absolute;
		top: 10px;
		font-size: 46px;
		cursor: pointer;
	}

	.link-btn {
		left: -55px;
	}

	.delete-btn {
		left: -105px;
		color: #dc3545;
	}

	.link-btn:hover {
		color: rgb(221, 255, 128);
	}

	.delete-btn:hover {
		color: #c82333;
	}

	.selected > .link-btn,
	.selected > .delete-btn {
		display: inline;
	}

	.chapter :global(.chapter) {
		margin-left: 24px;
		border-left: 1px solid #ccc;
	}
</style>

