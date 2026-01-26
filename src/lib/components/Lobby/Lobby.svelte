<script>
	import { onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api/api.js';
	import { subscribeToChannel, unsubscribeFromChannel } from '$lib/stores/cable';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';

	let currentUser = null;
	let searching = false;
	let openRooms = [];
	let loading = true;
	let channel = null;
	let refreshInterval = null;

	onMount(async () => {
		currentUser = get(user);
		if (!currentUser) {
			alert('Please sign in to use chatrooms');
			return;
		}

		loadOpenRooms();
		subscribeToLobby();
		
		// Refresh rooms every 3 seconds
		refreshInterval = setInterval(() => {
			loadOpenRooms();
		}, 3000);
	});

	onDestroy(() => {
		if (channel) {
			unsubscribeFromChannel('LobbyChannel', {});
		}
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function loadOpenRooms() {
		try {
			openRooms = await Api.get('/chat_rooms');
			loading = false;
		} catch (error) {
			console.error('Error loading open rooms:', error);
			loading = false;
		}
	}

	function subscribeToLobby() {
		subscribeToChannel('LobbyChannel', {}, {
			received(data) {
				if (data.type === 'matched' && data.chat_room) {
					// Stop searching if we were
					searching = false;
					// Navigate to chat room
					goto(`/chat/${data.chat_room.id}`);
				}
			}
		}).then((ch) => {
			channel = ch;
		});
	}

	async function beginMatchmaking() {
		if (searching) return;

		searching = true;
		try {
			// Get a random experiment or the first available one
			const experiments = await Api.get('/experiments');
			if (experiments.length === 0) {
				alert('No experiments available. Please create one first.');
				searching = false;
				return;
			}

			// Use the first experiment for now (could be random)
			const experiment = experiments[0];

			const response = await Api.post('/lobby/join', {
				chatroomable_type: 'Experiment',
				chatroomable_id: experiment.id
			});

			if (response.status === 'matched' && response.chat_room) {
				// Navigate to chat room
				goto(`/chat/${response.chat_room.id}`);
			} else {
				// Still searching, create a room and show it in the table
				await loadOpenRooms();
			}
		} catch (error) {
			console.error('Error starting matchmaking:', error);
			alert('Failed to start matchmaking. Please try again.');
		} finally {
			searching = false;
		}
	}

	async function joinRoom(room) {
		if (room.user2) return; // Room is full

		try {
			// Join the existing room by updating it
			const response = await Api.post('/lobby/join', {
				chatroomable_type: room.chatroomable_type,
				chatroomable_id: room.chatroomable_id
			});

			if (response.status === 'matched' && response.chat_room) {
				// Navigate to chat room immediately
				// The host will also be notified via WebSocket and redirected
				goto(`/chat/${response.chat_room.id}`);
			} else {
				// Still waiting, refresh the rooms list
				await loadOpenRooms();
			}
		} catch (error) {
			console.error('Error joining room:', error);
			alert('Failed to join room. Please try again.');
		}
	}
</script>

<div class="lobby">
	<div class="matchmaking-section">
		<button
			class="matchmaking-button"
			on:click={beginMatchmaking}
			disabled={searching}
		>
			{#if searching}
				<span class="spinner"></span>
				<span>Searching for match...</span>
			{:else}
				Begin Matchmaking
			{/if}
		</button>
	</div>

	<div class="rooms-section">
		<h3>Open Rooms</h3>
		{#if loading}
			<div class="loading">Loading rooms...</div>
		{:else if openRooms.length === 0}
			<div class="empty">No open rooms yet. Start matchmaking to create one!</div>
		{:else}
			<table class="rooms-table">
				<thead>
					<tr>
						<th>Topic</th>
						<th>Status</th>
						<th>Participants</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each openRooms as room (room.id)}
						<tr>
							<td class="topic">
								{room.chatroomable?.title || 'Untitled'}
							</td>
							<td class="status">
								<span class="status-badge" class:waiting={room.status === 'waiting'} class:active={room.status === 'active'}>
									{room.status === 'waiting' ? 'Waiting' : 'Active'}
								</span>
							</td>
							<td class="participants">
								{room.participant_count}/2
							</td>
							<td class="action">
								{#if room.is_host}
									<span class="host-badge">Host</span>
								{:else if room.can_join}
									<button class="join-button" on:click={() => joinRoom(room)}>
										Join
									</button>
								{:else}
									<span class="full-badge">Full</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	.lobby {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.matchmaking-section {
		text-align: center;
		margin-bottom: 3rem;
		padding: 2rem;
	}

	.matchmaking-button {
		padding: 1.5rem 3rem;
		font-size: 1.25rem;
		font-weight: 600;
		background: #97b1ff;
		color: #fff;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 250px;
		justify-content: center;
	}

	.matchmaking-button:hover:not(:disabled) {
		background: #7a9fff;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(151, 177, 255, 0.4);
	}

	.matchmaking-button:disabled {
		background: #ccc;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.rooms-section {
		background: #fff;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.rooms-section h3 {
		margin: 0 0 1.5rem 0;
		color: #333;
		font-size: 1.5rem;
	}

	.loading,
	.empty {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	.rooms-table {
		width: 100%;
		border-collapse: collapse;
	}

	.rooms-table thead {
		background: #f9f9f9;
		border-bottom: 2px solid #eee;
	}

	.rooms-table th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.rooms-table td {
		padding: 1rem;
		border-bottom: 1px solid #eee;
	}

	.rooms-table tbody tr:hover {
		background: #f9f9f9;
	}

	.topic {
		font-weight: 500;
		color: #333;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.status-badge.waiting {
		background: #fff3cd;
		color: #856404;
	}

	.status-badge.active {
		background: #d4edda;
		color: #155724;
	}

	.participants {
		font-weight: 500;
		color: #666;
	}

	.action {
		text-align: center;
	}

	.join-button {
		padding: 0.5rem 1.5rem;
		background: #97b1ff;
		color: #fff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.join-button:hover {
		background: #7a9fff;
	}

	.host-badge,
	.full-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.host-badge {
		background: #e3f2fd;
		color: #1976d2;
	}

	.full-badge {
		background: #f5f5f5;
		color: #999;
	}
</style>
