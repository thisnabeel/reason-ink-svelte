<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api/api.js';
	import { selectChapter, chaptersMap, chapters, selectedChapter } from '$lib/stores/main';
	import Row from './Row.svelte';

	let chaptersList;
	let newChapterTitle = '';
	let writing = false;

	chaptersMap.subscribe((value) => {
		chaptersList = value;
	});

	onMount(async function () {
		// Load chapters if not already loaded
		if ($chapters.length === 0) {
			await getChapters();
		} else if ($chaptersMap.length === 0) {
			// Build map from existing chapters
			buildChaptersMap($chapters);
		}
	});

	const getChapters = async () => {
		const response = await Api.get('/chapters.json');
		let json = response;
		chapters.set(json);
		buildChaptersMap(json);
	};

	const buildChaptersMap = (json) => {
		let parents = json.filter((obj) => {
			return obj.chapter_id === null;
		});
		parents.map((chapter) => {
			// Connect each Child to Parent
			connectChildToParent(chapter, json);
		});
		function connectChildToParent(chapter, allChapters) {
			let children = allChapters.filter((obj) => {
				return obj.chapter_id === chapter.id;
			});
			chapter['child_chapters'] = children;
			chapter['child_chapters'].map((child) => {
				// Connect each Child to Parent
				connectChildToParent(child, allChapters);
			});
		}
		chaptersMap.set(parents);
	};

	const findNode = (root, target) => {
		if (!root) {
			return null;
		}

		if (root.id === target.id) {
			return root;
		}

		for (let chapter of root.child_chapters || []) {
			const foundChapter = findNode(chapter, target);
			if (foundChapter) {
				return foundChapter;
			}
		}

		return null;
	};

	async function addChapter() {
		try {
			let response;
			if ($selectedChapter && $selectedChapter.id) {
				const clone = [...chaptersList];

				const node = findNode(
					{
						id: -1,
						child_chapters: clone
					},
					$selectedChapter
				);

				response = await Api.post('/chapters.json', {
					chapter: {
						title: newChapterTitle || 'Untitled Chapter',
						chapter_id: $selectedChapter.id
					}
				});

				node.child_chapters = [...(node.child_chapters || []), response];
				chaptersList = clone;
				chaptersMap.set(clone);
			} else {
				response = await Api.post('/chapters.json', {
					chapter: {
						title: newChapterTitle || 'Untitled Chapter'
					}
				});
				const updated = [...chaptersList, response];
				chaptersList = updated;
				chaptersMap.set(updated);
			}

			// Refresh the chapters list
			await getChapters();
		} catch (err) {
			console.error('Failed to create chapter:', err);
		}
	}

	async function removeChapter(chapter) {
		if (!$selectedChapter || !chapter) {
			return;
		}

		try {
			await Api.delete(`/chapters/${chapter.id}`);
			// Refresh the chapters list
			await getChapters();
			selectChapter(null);
		} catch (err) {
			console.error('Failed to delete chapter:', err);
		}
	}
</script>

<section>
	<div class="sticky">
		<div class="input-group">
			<input
				type="text"
				class="form-control"
				placeholder="Add Chapter"
				aria-label="Add Chapter"
				bind:value={newChapterTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						addChapter();
					}
				}}
			/>
			<div class="input-group-append" on:click={addChapter}>
				{#if $selectedChapter}
					<div class="btn btn-warning">Nest</div>
				{:else}
					<div class="btn btn-info">Add</div>
				{/if}
			</div>
		</div>
	</div>

	{#each chaptersList || [] as chapter}
		<ul class="clean-list">
			<Row item={chapter} type="chapter" {removeChapter} />
		</ul>
	{/each}
</section>

<style>
	.sticky {
		position: sticky;
		top: 1rem;
		padding: 1rem;
		background: #fff;
		transition: all 0.3s;
		z-index: 9999;
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		width: 100%;
	}

	.form-control {
		flex: 1;
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ced4da;
		border-radius: 0.25rem 0 0 0.25rem;
	}

	.input-group-append {
		cursor: pointer;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: 400;
		text-align: center;
		white-space: nowrap;
		user-select: none;
	}

	.btn-info {
		color: #fff;
		background-color: #17a2b8;
		border-color: #17a2b8;
	}

	.btn-info:hover {
		background-color: #138496;
		border-color: #117a8b;
	}

	.btn-warning {
		color: #212529;
		background-color: #ffc107;
		border-color: #ffc107;
	}

	.btn-warning:hover {
		background-color: #e0a800;
		border-color: #d39e00;
	}

	.clean-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>

