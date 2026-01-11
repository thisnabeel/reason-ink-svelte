<script>
	export let element;
	export let elementType;
	import Api from '$lib/api/api/api.js';

	let abstractions = element.abstractions || [];

	const addAbstraction = async () => {
		const response = await Api.post('/abstractions.json', {
			abstraction: {
				abstractable_id: element.id,
				abstractable_type: 'Concept',
				body: 'New abstraction'
			}
		});
		abstractions = [...abstractions, response];
		element.abstractions = abstractions;
	};

	async function handleRemoveAbstraction(abstraction) {
		await Api.delete(`/abstractions/${abstraction.id}`);
		abstractions = abstractions.filter((a) => a.id !== abstraction.id);
		element.abstractions = abstractions;
	}
</script>

<ul class="abstractions">
	<div class="adder">
		<div class="add-abstraction" on:click={addAbstraction}>+</div>
	</div>
	{#if abstractions.length > 0}
		{#each abstractions as abstraction}
			<li class="abstraction">
				<span contenteditable>{abstraction.body || ''}</span>
				<span class="fa fa-trash" on:click={() => handleRemoveAbstraction(abstraction)} />
			</li>
		{/each}
	{:else}
		<div class="cta">
			<h1>No Abstractions Yet.</h1>
		</div>
	{/if}
</ul>

<style>
	.cta {
		background: rgb(207, 41, 41);
		color: #fff;
		display: block;
		padding: 3em;
		border-radius: 8px;
		text-align: center;
	}

	.cta h1 {
		color: #fff;
	}

	.adder {
		font-size: 72px;
		position: absolute;
		left: 35%;
		height: 0px;
		color: #ffd67f;
		width: 0px;
		bottom: 60px;
		display: -webkit-inline-box;
	}

	.add-abstraction {
		cursor: pointer;
	}

	.abstractions {
		font-size: 24px;
		color: #000;
		position: relative;
		margin: 10px;
		text-align: left;
		list-style: none;
		width: 70%;
		margin: 0 auto;
		padding: 20px 0;
	}

	.abstraction {
		position: relative;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.abstraction span[contenteditable] {
		display: block;
		min-height: 100px;
	}

	.abstraction .fa-trash {
		position: absolute;
		top: 10px;
		right: 10px;
		cursor: pointer;
		color: #dc3545;
		font-size: 24px;
	}

	.abstraction .fa-trash:hover {
		color: #c82333;
	}

	@media (max-width: 480px) {
		.abstractions {
			width: 100%;
		}
	}
</style>

