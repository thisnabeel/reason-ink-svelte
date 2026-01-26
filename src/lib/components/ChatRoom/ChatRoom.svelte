<script>
	import { onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/user';
	import Api from '$lib/api/api/api.js';
	import { subscribeToChannel, unsubscribeFromChannel } from '$lib/stores/cable';
	import { get } from 'svelte/store';

	export let chatRoomId;
	export let chatroomable;

	let messages = [];
	let newMessage = '';
	let loading = true;
	let currentUser = null;
	let chatRoom = null;
	let channel = null;
	let otherUser = null;
	let otherUserOnline = false;
	let lobbyChannel = null;
	let otherUserTyping = false;
	let typingTimeout = null;
	let typingDebounceTimeout = null;
	
	// Panel state
	let activeTab = null; // null or experiment id
	let openTabs = []; // Array of {id, title, body}
	let fetchingExperiment = false;

	onMount(async () => {
		currentUser = get(user);
		if (!currentUser) return;

		// Reset state when mounting (in case of page reload)
		otherUserTyping = false;
		if (typingTimeout) {
			clearTimeout(typingTimeout);
			typingTimeout = null;
		}
		if (typingDebounceTimeout) {
			clearTimeout(typingDebounceTimeout);
			typingDebounceTimeout = null;
		}

		// Load chat room
		try {
			chatRoom = await Api.get(`/chat_rooms/${chatRoomId}`);
			// Determine the other user
			if (chatRoom.user1 && chatRoom.user1.id === currentUser.id) {
				otherUser = chatRoom.user2;
			} else if (chatRoom.user2 && chatRoom.user2.id === currentUser.id) {
				otherUser = chatRoom.user1;
			}
			
			// Load current experiment if exists
			if (chatRoom.current_experiment) {
				openTab(chatRoom.current_experiment);
			}
			
			await loadMessages();
			await subscribeToChat();
			await subscribeToPresence();
		} catch (error) {
			console.error('Error loading chat room:', error);
			loading = false;
		}
	});

	onDestroy(() => {
		// Clean up subscriptions
		if (channel) {
			unsubscribeFromChannel('ChatChannel', { room_id: chatRoomId });
			channel = null;
		}
		if (lobbyChannel) {
			unsubscribeFromChannel('LobbyChannel', {});
			lobbyChannel = null;
		}
		// Clean up timeouts
		if (typingTimeout) {
			clearTimeout(typingTimeout);
			typingTimeout = null;
		}
		if (typingDebounceTimeout) {
			clearTimeout(typingDebounceTimeout);
			typingDebounceTimeout = null;
		}
		// Reset typing state
		otherUserTyping = false;
	});

	async function loadMessages() {
		try {
			const loadedMessages = await Api.get(`/chat_rooms/${chatRoomId}/chat_messages`);
			// Parse metadata if it's a string
			messages = loadedMessages.map(msg => {
				if (msg.metadata && typeof msg.metadata === 'string') {
					try {
						msg.metadata = JSON.parse(msg.metadata);
					} catch (e) {
						console.error('Error parsing metadata:', e);
					}
				}
				return msg;
			});
			loading = false;
			// Scroll to bottom after loading messages
			scrollToBottom();
		} catch (error) {
			console.error('Error loading messages:', error);
			loading = false;
		}
	}

	async function subscribeToChat() {
		// Unsubscribe from existing channel if it exists (in case of reconnection)
		if (channel) {
			unsubscribeFromChannel('ChatChannel', { room_id: chatRoomId });
			channel = null;
		}
		
		channel = await subscribeToChannel('ChatChannel', { room_id: chatRoomId }, {
			connected() {
				// When we connect, the other user will be notified
				// Reset typing indicator on reconnect
				otherUserTyping = false;
				if (typingTimeout) {
					clearTimeout(typingTimeout);
					typingTimeout = null;
				}
			},
			disconnected() {
				// Clear typing indicator when disconnected
				otherUserTyping = false;
				if (typingTimeout) {
					clearTimeout(typingTimeout);
					typingTimeout = null;
				}
			},
			received(data) {
				// Handle typing indicator
				if (data.type === 'typing') {
					if (data.user_id === otherUser?.id) {
						otherUserTyping = true;
						// Clear typing indicator after 3 seconds
						if (typingTimeout) {
							clearTimeout(typingTimeout);
						}
						typingTimeout = setTimeout(() => {
							otherUserTyping = false;
						}, 3000);
					}
					return;
				}
				
				// Clear typing indicator when a message is received
				if (data.type === 'message' || data.type === 'experiment_change') {
					otherUserTyping = false;
					if (typingTimeout) {
						clearTimeout(typingTimeout);
					}
				}
				if (data.type === 'message') {
					// Parse metadata if it's a string
					if (data.metadata && typeof data.metadata === 'string') {
						try {
							data.metadata = JSON.parse(data.metadata);
						} catch (e) {
							console.error('Error parsing metadata:', e);
						}
					}
					// Check if message already exists to avoid duplicates
					if (!messages.find(m => m.id === data.id)) {
						messages = [...messages, data];
						scrollToBottom();
					}
				} else if (data.type === 'experiment_change') {
					// Handle experiment change - add message and open tab for both users
					// The data itself is the message with experiment info
					const messageData = {
						id: data.id,
						content: data.content,
						user_id: data.user_id,
						username: data.username,
						message_type: data.message_type || 'experiment_change',
						metadata: data.metadata,
						created_at: data.created_at
					};
					
					// Parse metadata if it's a string
					if (messageData.metadata && typeof messageData.metadata === 'string') {
						try {
							messageData.metadata = JSON.parse(messageData.metadata);
						} catch (e) {
							console.error('Error parsing metadata:', e);
						}
					}
					
					// Check if message already exists to avoid duplicates
					if (!messages.find(m => m.id === messageData.id)) {
						messages = [...messages, messageData];
						scrollToBottom();
					}
					
					// Open experiment in tab for both users - prioritize data.experiment
					if (data.experiment && data.experiment.id) {
						openTab(data.experiment);
					} else if (messageData.metadata && messageData.metadata.experiment_id) {
						// Fallback: extract from message metadata
						openTab({
							id: messageData.metadata.experiment_id,
							title: messageData.metadata.experiment_title,
							body: messageData.metadata.experiment_body
						});
					}
				}
			}
		});
	}

	async function subscribeToPresence() {
		// Unsubscribe from existing channel if it exists (in case of reconnection)
		if (lobbyChannel) {
			unsubscribeFromChannel('LobbyChannel', {});
			lobbyChannel = null;
		}
		
		// Subscribe to LobbyChannel to receive presence updates
		lobbyChannel = await subscribeToChannel('LobbyChannel', {}, {
			connected() {
				// Reset online status on reconnect - will be updated by presence events
				otherUserOnline = false;
			},
			received(data) {
				if (data.type === 'presence' && data.chat_room_id === parseInt(chatRoomId)) {
					if (data.user_id === otherUser?.id) {
						otherUserOnline = data.status === 'online';
					}
				}
			}
		});
	}

	async function fetchRandomExperiment() {
		if (fetchingExperiment || !chatRoom.user2) return;
		
		fetchingExperiment = true;
		try {
			const response = await Api.post(`/chat_rooms/${chatRoomId}/fetch_random_experiment`);
			if (response.experiment) {
				console.log('Fetched experiment:', response.experiment);
				openTab(response.experiment);
			}
		} catch (error) {
			console.error('Error fetching experiment:', error);
			alert('Failed to fetch experiment. Please try again.');
		} finally {
			fetchingExperiment = false;
		}
	}

	function openTab(experiment) {
		if (!experiment || !experiment.id) {
			console.error('Invalid experiment data:', experiment);
			return;
		}
		
		console.log('Opening tab with experiment:', experiment);
		
		// Check if tab already exists
		const existingTabIndex = openTabs.findIndex(t => t.id === experiment.id);
		if (existingTabIndex === -1) {
			// Add new tab
			openTabs = [...openTabs, {
				id: experiment.id,
				title: experiment.title || 'Untitled Experiment',
				body: experiment.body || ''
			}];
			console.log('Added new tab, body length:', (experiment.body || '').length);
		} else {
			// Update existing tab with new data
			openTabs = openTabs.map((t, index) => 
				index === existingTabIndex
					? { 
						id: experiment.id,
						title: experiment.title || t.title, 
						body: experiment.body || t.body 
					}
					: t
			);
			console.log('Updated existing tab, body length:', (experiment.body || openTabs[existingTabIndex].body || '').length);
		}
		activeTab = experiment.id;
		console.log('Active tab set to:', activeTab, 'Tab content:', openTabs.find(t => t.id === activeTab));
	}

	function closeTab(tabId) {
		openTabs = openTabs.filter(t => t.id !== tabId);
		if (activeTab === tabId) {
			activeTab = openTabs.length > 0 ? openTabs[0].id : null;
		}
	}

	function handleExperimentClick(message) {
		if (message.metadata && message.metadata.experiment_id) {
			// Find experiment from metadata
			const experiment = {
				id: message.metadata.experiment_id,
				title: message.metadata.experiment_title,
				body: message.metadata.experiment_body
			};
			openTab(experiment);
		}
	}

	function sendTypingIndicator() {
		if (!channel || !currentUser) return;
		
		// Debounce typing indicator - only send after user stops typing for 500ms
		if (typingDebounceTimeout) {
			clearTimeout(typingDebounceTimeout);
		}
		
		typingDebounceTimeout = setTimeout(() => {
			if (channel) {
				// Use perform for ActionCable or send if available
				if (channel.perform) {
					channel.perform('receive', {
						type: 'typing',
						user_id: currentUser.id
					});
				} else if (channel.send) {
					channel.send({
						type: 'typing',
						user_id: currentUser.id
					});
				}
			}
		}, 500);
	}

	function handleTyping() {
		if (newMessage.trim()) {
			sendTypingIndicator();
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !currentUser) return;

		// Clear typing debounce
		if (typingDebounceTimeout) {
			clearTimeout(typingDebounceTimeout);
		}

		try {
			await Api.post(`/chat_rooms/${chatRoomId}/chat_messages`, {
				content: newMessage.trim()
			});
			newMessage = '';
		} catch (error) {
			console.error('Error sending message:', error);
		}
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		} else {
			// User is typing
			handleTyping();
		}
	}

	function scrollToBottom() {
		setTimeout(() => {
			const messagesContainer = document.querySelector('.messages-container');
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}, 100);
	}

	function getActiveTabContent() {
		return openTabs.find(t => t.id === activeTab);
	}
</script>

<div class="chatroom-container">
	{#if loading}
		<div class="loading">Loading chat...</div>
	{:else if chatRoom}
		<!-- Left Panel: Chat (Smaller) -->
		<div class="chat-panel">
			<div class="chat-header">
				<div class="header-info">
					<h3>Chat</h3>
					{#if otherUser}
						<p class="participant">
							{otherUser.username}
							<span class="status-indicator" class:online={otherUserOnline} class:offline={!otherUserOnline}>
								<span class="status-dot"></span>
								{otherUserOnline ? 'Online' : 'Offline'}
							</span>
						</p>
					{:else}
						<p class="waiting">Waiting for someone to join...</p>
					{/if}
				</div>
			</div>

			<div class="messages-container">
				{#each messages as message (message.id)}
					{#if message.message_type === 'experiment_change'}
						<div class="experiment-message" on:click={() => handleExperimentClick(message)}>
							<div class="experiment-icon">📚</div>
							<div class="experiment-content">
								<div class="experiment-title">{message.content}</div>
								<div class="experiment-hint">Click to open in panel</div>
							</div>
						</div>
					{:else}
						<div class="message" class:own-message={message.user_id === currentUser?.id}>
							<div class="message-header">
								<span class="username">{message.username}</span>
								<span class="timestamp">
									{new Date(message.created_at).toLocaleTimeString()}
								</span>
							</div>
							<div class="message-content">{message.content}</div>
						</div>
					{/if}
				{/each}
				
				{#if otherUserTyping && otherUser}
					<div class="typing-indicator">
						<div class="typing-dots">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<span class="typing-text">{otherUser.username} is typing...</span>
					</div>
				{/if}
			</div>

			<div class="message-input-container">
				<textarea
					bind:value={newMessage}
					on:keydown={handleKeyPress}
					on:input={handleTyping}
					placeholder="Type your message..."
					disabled={!chatRoom.user2}
				></textarea>
				<button on:click={sendMessage} disabled={!newMessage.trim() || !chatRoom.user2}>
					Send
				</button>
			</div>
		</div>

		<!-- Right Panel: Content (Bigger) -->
		<div class="content-panel">
			<div class="panel-header">
				<div class="tabs">
					{#each openTabs as tab (tab.id)}
						<button
							class="tab-button"
							class:active={activeTab === tab.id}
							on:click={() => (activeTab = tab.id)}
						>
							<span class="tab-title">{tab.title}</span>
							<span 
								class="close-tab" 
								on:click|stopPropagation={() => closeTab(tab.id)}
								on:keydown={(e) => e.key === 'Enter' && closeTab(tab.id)}
								role="button" 
								tabindex="0"
							>×</span>
						</button>
					{/each}
				</div>
				<button
					class="fetch-button"
					on:click={fetchRandomExperiment}
					disabled={fetchingExperiment || !chatRoom.user2}
				>
					{#if fetchingExperiment}
						<span class="spinner-small"></span>
					{:else}
						🎲
					{/if}
					Fetch Random Experiment
				</button>
			</div>

			<div class="panel-content">
				{#if activeTab}
					{@const tabContent = getActiveTabContent()}
					{#if tabContent}
						<div class="experiment-content">
							<h2>{tabContent.title || 'Untitled Experiment'}</h2>
							{#if tabContent.body}
								<div class="experiment-body" >{@html tabContent.body}</div>
							{:else}
								<div class="empty-panel">
									<p>No content available for this experiment</p>
								</div>
							{/if}
						</div>
					{:else}
						<div class="empty-panel">
							<p>Tab content not found</p>
						</div>
					{/if}
				{:else}
					<div class="empty-panel">
						<p>No experiment loaded</p>
						<p class="hint">Click "Fetch Random Experiment" to get started</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.chatroom-container {
		display: flex;
		height: calc(100vh - 200px);
		max-width: 1400px;
		margin: 0 auto;
		gap: 1rem;
		padding: 1rem;
	}

	.loading {
		padding: 2rem;
		text-align: center;
		color: #666;
		width: 100%;
	}

	/* Left Panel: Chat */
	.chat-panel {
		flex: 0 0 400px;
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.chat-header {
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #eee;
		background: #f9f9f9;
	}

	.header-info h3 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 1.1rem;
	}

	.participant {
		margin: 0;
		color: #666;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #999;
		transition: background 0.3s;
	}

	.status-indicator.online .status-dot {
		background: #4caf50;
		box-shadow: 0 0 3px rgba(76, 175, 80, 0.5);
	}

	.status-indicator.online {
		color: #4caf50;
	}

	.status-indicator.offline {
		color: #999;
	}

	.waiting {
		margin: 0;
		color: #97b1ff;
		font-size: 0.85rem;
		font-style: italic;
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: #fafafa;
	}

	.message {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 8px;
		background: #f5f5f5;
		max-width: 85%;
	}

	.message.own-message {
		background: #e3f2fd;
		margin-left: auto;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.8rem;
	}

	.username {
		font-weight: 600;
		color: #97b1ff;
	}

	.timestamp {
		color: #999;
		font-size: 0.75rem;
	}

	.message-content {
		color: #333;
		line-height: 1.5;
		white-space: pre-wrap;
		word-wrap: break-word;
		font-size: 0.9rem;
	}

	.experiment-message {
		margin-bottom: 1rem;
		padding: 1rem;
		border-radius: 8px;
		background: linear-gradient(135deg, #f0f4ff 0%, #e3f2fd 100%);
		border: 2px solid #97b1ff;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.experiment-message:hover {
		background: linear-gradient(135deg, #e3f2fd 0%, #d1e7ff 100%);
		transform: translateX(4px);
		box-shadow: 0 2px 8px rgba(151, 177, 255, 0.3);
	}

	.experiment-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.experiment-content {
		flex: 1;
	}

	.experiment-title {
		font-weight: 600;
		color: #1976d2;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	.experiment-hint {
		font-size: 0.75rem;
		color: #666;
		font-style: italic;
	}

	.typing-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		color: #666;
		font-size: 0.85rem;
		font-style: italic;
	}

	.typing-dots {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.typing-dots span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #97b1ff;
		animation: typing 1.4s infinite;
	}

	.typing-dots span:nth-child(1) {
		animation-delay: 0s;
	}

	.typing-dots span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-dots span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.7;
		}
		30% {
			transform: translateY(-8px);
			opacity: 1;
		}
	}

	.typing-text {
		color: #666;
	}

	.message-input-container {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid #eee;
		background: #fff;
	}

	.message-input-container textarea {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		resize: none;
		min-height: 50px;
		font-family: inherit;
		font-size: 14px;
	}

	.message-input-container textarea:disabled {
		background: #f0f0f0;
		cursor: not-allowed;
	}

	.message-input-container button {
		padding: 0.75rem 1.5rem;
		background: #97b1ff;
		color: #fff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.message-input-container button:hover:not(:disabled) {
		background: #7a9fff;
	}

	.message-input-container button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	/* Right Panel: Content */
	.content-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		min-width: 0;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #eee;
		background: #f9f9f9;
		gap: 1rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		flex: 1;
		overflow-x: auto;
	}

	.tab-button {
		padding: 0.5rem 1rem;
		background: #f0f0f0;
		border: 1px solid #ddd;
		border-radius: 4px 4px 0 0;
		cursor: pointer;
		font-size: 0.9rem;
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
		position: relative;
	}

	.tab-button:hover {
		background: #e0e0e0;
	}

	.tab-button.active {
		background: #fff;
		border-bottom-color: #fff;
		color: #97b1ff;
		font-weight: 500;
	}

	.tab-title {
		flex: 1;
	}

	.close-tab {
		padding: 0;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #ccc;
		color: #fff;
		cursor: pointer;
		font-size: 12px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
		flex-shrink: 0;
	}

	.close-tab:hover {
		background: #999;
	}

	.fetch-button {
		padding: 0.5rem 1rem;
		background: #97b1ff;
		color: #fff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.2s;
		white-space: nowrap;
	}

	.fetch-button:hover:not(:disabled) {
		background: #7a9fff;
	}

	.fetch-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.spinner-small {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		background: #fff;
	}

	.experiment-content {
		max-width: 900px;
		margin: 0 auto;
	}

	.experiment-content h2 {
		margin: 0 0 1.5rem 0;
		color: #333;
		font-size: 1.8rem;
	}

	.experiment-body {
		color: #333;
		line-height: 1.8;
		font-size: 1rem;
	}

	.experiment-body :global(p) {
		margin-bottom: 1rem;
	}

	.experiment-body :global(strong) {
		font-weight: 600;
		color: #1976d2;
	}

	.empty-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #999;
		text-align: center;
	}

	.empty-panel p {
		margin: 0.5rem 0;
	}

	.hint {
		font-size: 0.9rem;
		font-style: italic;
	}

	@media (max-width: 1024px) {
		.chatroom-container {
			flex-direction: column;
			height: auto;
		}

		.chat-panel {
			flex: 0 0 400px;
		}

		.content-panel {
			flex: 0 0 500px;
		}
	}
</style>
