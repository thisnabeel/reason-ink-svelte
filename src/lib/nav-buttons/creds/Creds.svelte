<script>
	import Api from '$lib/api/api/api.js';
	import { user } from '$lib/stores/user';

	let username;
	let password;
	let email;
	let passwordConfirmation;
	let isSignUp = false;
	let error = '';
	let loading = false;

	export let hidePopUp;

	const authenticate = async () => {
		if (loading) return;
		
		error = '';
		loading = true;

		try {
			if (isSignUp) {
				// Sign up
				if (!email || !password || !passwordConfirmation) {
					error = 'Please fill in all fields';
					loading = false;
					return;
				}

				if (password !== passwordConfirmation) {
					error = 'Passwords do not match';
					loading = false;
					return;
				}

				const response = await Api.post('/users', {
					user: {
						email: email,
						password: password,
						password_confirmation: passwordConfirmation,
						username: username || email.split('@')[0]
					}
				});

				if (response['id']) {
					user.set(response);
					hidePopUp();
				}
			} else {
				// Sign in
				if (!username || !password) {
					error = 'Please enter username/email and password';
					loading = false;
					return;
				}

				const response = await Api.post('/users/sign_in', {
					login: username,
					password: password
				});

				if (response['id']) {
					user.set(response);
					hidePopUp();
				} else {
					error = 'Invalid credentials';
				}
			}
		} catch (err) {
			console.error('Auth error:', err);
			if (err.response?.data?.errors) {
				error = Array.isArray(err.response.data.errors) 
					? err.response.data.errors.join(', ') 
					: err.response.data.errors;
			} else {
				error = isSignUp ? 'Failed to create account' : 'Invalid credentials';
			}
		} finally {
			loading = false;
		}
	};

	const toggleMode = () => {
		isSignUp = !isSignUp;
		error = '';
		username = '';
		password = '';
		email = '';
		passwordConfirmation = '';
	};
</script>

<div class="form">
	<div class="form-header">
		<h3>{isSignUp ? 'Sign Up' : 'Sign In'}</h3>
		<button class="close-button" on:click={hidePopUp}>×</button>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	{#if isSignUp}
		<label>Email:</label>
		<input type="email" bind:value={email} placeholder="your@email.com" disabled={loading} />

		<label>Username:</label>
		<input type="text" bind:value={username} placeholder="username" disabled={loading} />
	{:else}
		<label>Username or Email:</label>
		<input type="text" bind:value={username} placeholder="username or email" disabled={loading} />
	{/if}

	<label>Password:</label>
	<input type="password" bind:value={password} placeholder="password" disabled={loading} />

	{#if isSignUp}
		<label>Confirm Password:</label>
		<input type="password" bind:value={passwordConfirmation} placeholder="confirm password" disabled={loading} />
	{/if}

	<button class="submit-button" on:click={authenticate} disabled={loading}>
		{loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
	</button>

	<button class="toggle-button" on:click={toggleMode} disabled={loading}>
		{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
	</button>
</div>

<style>
	.form {
		max-width: 300px;
		margin: 0 auto;
		background: #fff;
		padding: 30px;
		border-radius: 6px;
		border: 9px solid #f6f8ff;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.form-header h3 {
		margin: 0;
		color: #333;
		font-size: 20px;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 28px;
		color: #999;
		cursor: pointer;
		padding: 0;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.close-button:hover {
		color: #333;
	}

	.error-message {
		background: #fee;
		color: #c33;
		padding: 10px;
		border-radius: 4px;
		margin-bottom: 15px;
		font-size: 14px;
	}

	label {
		display: block;
		margin-top: 15px;
		margin-bottom: 5px;
		color: #333;
		font-size: 14px;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 10px;
		font-family: inherit;
		color: rgb(49, 49, 49);
		border: solid 1px #ccc;
		border-radius: 4px;
		font-size: 14px;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #97b1ff;
	}

	input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.submit-button {
		margin-top: 20px;
		background-color: #97b1ff;
		color: #fff;
		display: block;
		width: 100%;
		padding: 12px;
		font-size: 16px;
		font-weight: 500;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #7a9fff;
	}

	.submit-button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.toggle-button {
		margin-top: 15px;
		background: none;
		border: none;
		color: #97b1ff;
		cursor: pointer;
		font-size: 14px;
		text-decoration: underline;
		padding: 5px;
		width: 100%;
	}

	.toggle-button:hover:not(:disabled) {
		color: #7a9fff;
	}

	.toggle-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>

