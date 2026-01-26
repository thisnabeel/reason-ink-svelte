<script>
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api/api.js';
	import CredsPopUp from './creds/Creds.svelte';

	let user_signed_in;
	user.subscribe((value) => (user_signed_in = value));

	const sign_out = async () => {
		try {
			await Api.delete('/users/sign_out');
			user.set(null);
			showSettings = false;
		} catch (error) {
			console.error('Sign out error:', error);
		}
	};

	let showSettings = false;
	let showLogIn = false;
</script>

<aside class="user">
	{#if user_signed_in}
		<button class="nav-button" aria-label="User" on:click={() => (showSettings = !showSettings)}>
			<i class="fa fa-user"></i>
		</button>

		{#if showSettings}
			<div class="settings-menu">
				<button class="settings-button" on:click={sign_out}>
					<i class="fa fa-sign-out"></i> Sign Out
				</button>
			</div>
		{/if}
	{:else}
		<button class="nav-button" aria-label="User" on:click={() => (showLogIn = !showLogIn)}>
			<i class="fa fa-user"></i>
		</button>
		{#if showLogIn}
			<div class="creds-pop">
				<CredsPopUp hidePopUp={() => (showLogIn = !showLogIn)} />
			</div>
		{/if}
	{/if}
</aside>

<style>
	.user {
		position: relative;
	}

	.nav-button {
		background: #fff;
		border-radius: 100%;
		height: 50px;
		width: 50px;
		border: none;
		cursor: pointer;
		position: relative;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.nav-button:active {
		transform: scale(0.95);
	}

	.nav-button .fa {
		font-size: 20px;
		color: #97b1ff;
	}

	.creds-pop {
		position: absolute;
		width: 300px;
		z-index: 9999;
		cursor: auto;
		right: 0;
		top: 60px;
	}

	.settings-menu {
		position: absolute;
		right: 0;
		top: 60px;
		background: #fff;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 8px 0;
		min-width: 150px;
		z-index: 9999;
	}

	.settings-button {
		width: 100%;
		padding: 12px 20px;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: #333;
		font-size: 14px;
		display: flex;
		align-items: center;
		gap: 10px;
		transition: background 0.2s ease;
	}

	.settings-button:hover {
		background: #f5f5f5;
	}

	.settings-button .fa {
		color: #97b1ff;
		font-size: 16px;
	}

	@media (max-width: 768px) {
		.nav-button {
			height: 40px;
			width: 40px;
		}

		.nav-button .fa {
			font-size: 18px;
		}

		.creds-pop {
			right: -50px;
			width: 280px;
		}

		.settings-menu {
			right: -50px;
		}
	}
</style>

