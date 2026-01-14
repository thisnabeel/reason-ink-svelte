<script>
	import { goto } from '$app/navigation';
	import { selectedChapter, selectChapter } from '$lib/stores/main';

	export let item;
	export let type;
	export let removeChapter;

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
		display: block;
		font-size: 28px;
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

