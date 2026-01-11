<script>
	import { onMount } from 'svelte';
	import Api from '$lib/api/api/api.js';
	import { selectConcept, conceptsMap, concepts, selectedConcept } from '$lib/stores/main';
	import Row from './Row.svelte';

	let conceptsList;
	let newConceptTitle = '';
	let writing = false;

	conceptsMap.subscribe((value) => {
		console.log('conceptsMap', value);
		conceptsList = value;
	});

	onMount(async function () {
		// Load concepts if not already loaded
		if ($concepts.length === 0) {
			await getConcepts();
		} else if ($conceptsMap.length === 0) {
			// Build map from existing concepts
			buildConceptsMap($concepts);
		}
	});

	const getConcepts = async () => {
		const response = await Api.get('/concepts.json');
		console.log('response', response);
		let json = response;
		concepts.set(json);
		console.log('concepts set', $concepts);
		buildConceptsMap(json);
	};

	const buildConceptsMap = (json) => {
		let parents = json.filter((obj) => {
			return obj.concept_id === null;
		});
		parents.map((concept, index) => {
			// Connect each Child to Parent
			connectChildToParent(concept, json);
		});
		function connectChildToParent(concept, allConcepts) {
			let children = allConcepts.filter((obj) => {
				return obj.concept_id === concept.id;
			});
			concept['child_concepts'] = children;
			concept['child_concepts'].map((child, index) => {
				// Connect each Child to Parent
				connectChildToParent(child, allConcepts);
			});
		}
		console.log('concepts map', parents);
		conceptsMap.set(parents);
	};

	const findNode = (root, target) => {
		if (!root) {
			return null;
		}

		if (root.id === target.id) {
			return root;
		}

		for (let concept of root.child_concepts || []) {
			const foundConcept = findNode(concept, target);
			if (foundConcept) {
				return foundConcept;
			}
		}

		return null;
	};

	const findParentNode = (root, target) => {
		if (!root) {
			return null;
		}
		if (!target) {
			return null;
		}
		if (root.id === target.concept_id) {
			return root;
		}

		for (let concept of root.child_concepts || []) {
			const foundConcept = findParentNode(concept, target);
			if (foundConcept) {
				return foundConcept;
			}
		}

		return null;
	};

	async function addConcept() {
		if (newConceptTitle.length > 0) {
			try {
				let response;
				if ($selectedConcept && $selectedConcept.id) {
					const clone = [...conceptsList];

					const node = findNode(
						{
							id: -1,
							child_concepts: clone
						},
						$selectedConcept
					);

					response = await Api.post('/concepts.json', {
						concept: {
							title: newConceptTitle,
							concept_id: $selectedConcept.id,
							concept_type: 'idea'
						}
					});

					node.child_concepts = [...(node.child_concepts || []), response];
					conceptsList = clone;
					conceptsMap.set(clone);
				} else {
					response = await Api.post('/concepts.json', {
						concept: {
							title: newConceptTitle,
							concept_type: 'idea'
						}
					});
					const updated = [...conceptsList, response];
					conceptsList = updated;
					conceptsMap.set(updated);
				}

				// Refresh the concepts list
				await getConcepts();
				newConceptTitle = '';
			} catch (err) {
				console.error('Failed to create concept:', err);
			}
		}
	}

	async function removeConcept(concept) {
		if (!$selectedConcept || !concept) {
			return;
		}

		try {
			await Api.delete(`/concepts/${concept.id}`);
			// Refresh the concepts list
			await getConcepts();
			selectConcept(null);
		} catch (err) {
			console.error('Failed to delete concept:', err);
		}
	}
</script>

<section>
	<div class="sticky">
		<div class="input-group">
			<input
				type="text"
				class="form-control"
				placeholder="Add Concept"
				aria-label="Add Concept"
				bind:value={newConceptTitle}
				on:focus={() => (writing = true)}
				on:blur={() => (writing = false)}
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						addConcept();
					}
				}}
			/>
			<div class="input-group-append" on:click={addConcept}>
				{#if $selectedConcept}
					<div class="btn btn-warning">Nest</div>
				{:else}
					<div class="btn btn-info">Add</div>
				{/if}
			</div>
		</div>
	</div>

	{#each conceptsList || [] as concept}
		<ul class="clean-list">
			<Row item={concept} type="concept" {removeConcept} />
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
		border-radius: 0 0.25rem 0.25rem 0;
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
