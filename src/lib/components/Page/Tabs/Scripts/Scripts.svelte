<script>
	export let element;
	export let elementType;
	import Api from '$lib/api/api/api.js';

	let scripts = element.scripts || [];

	const addScript = async () => {
		const response = await Api.post('/scripts.json', {
			script: {
				scriptable_id: element.id,
				scriptable_type: 'Concept',
				title: 'New script',
				body: ''
			}
		});
		scripts = [...scripts, response];
		element.scripts = scripts;
	};

	const destroy = async (script) => {
		await Api.delete(`/scripts/${script.id}`);
		scripts = scripts.filter((s) => s.id !== script.id);
		element.scripts = scripts;
	};
</script>

<div class="scripts">
	<div class="adder">
		<div class="add-script" on:click={addScript}>+</div>
	</div>

	{#if scripts.length > 0}
		<ul class="clean-list">
			{#each scripts as script}
				<li class="script">
					<h3 contenteditable>{script.title || ''}</h3>
					<div contenteditable>{script.body || ''}</div>
					<span class="fa fa-trash" on:click={() => destroy(script)} />
				</li>
			{/each}
		</ul>
	{:else}
		<div class="cta">
			<h1>No Scripts Yet.</h1>
		</div>
	{/if}
</div>

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

	.add-script {
		cursor: pointer;
	}

	.clean-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.scripts {
		position: relative;
		margin: 20px;
	}

	.script {
		position: relative;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.script h3[contenteditable] {
		margin-top: 0;
		min-height: 30px;
	}

	.script div[contenteditable] {
		min-height: 100px;
	}

	.script .fa-trash {
		position: absolute;
		top: 10px;
		right: 10px;
		cursor: pointer;
		color: #dc3545;
		font-size: 24px;
	}

	.script .fa-trash:hover {
		color: #c82333;
	}
</style>

