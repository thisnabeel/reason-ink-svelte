<script>
	import ChatRoom from '$lib/components/ChatRoom/ChatRoom.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Api from '$lib/api/api/api.js';

	let chatRoomId = null;
	let chatroomable = null;
	let loading = true;

	onMount(async () => {
		chatRoomId = $page.params.id;
		
		try {
			const room = await Api.get(`/chat_rooms/${chatRoomId}`);
			chatroomable = room.chatroomable;
			loading = false;
		} catch (error) {
			console.error('Error loading chat room:', error);
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="loading">Loading chat room...</div>
{:else if chatRoomId}
	<ChatRoom {chatRoomId} {chatroomable} />
{:else}
	<div class="error">Chat room not found</div>
{/if}

<style>
	.loading,
	.error {
		text-align: center;
		padding: 3rem;
		color: #666;
	}
</style>

