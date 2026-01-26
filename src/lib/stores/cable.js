import { browser } from '$app/environment';
import { user } from './user';
import { get } from 'svelte/store';

let ActionCable = null;
let cable = null;
let subscriptions = {};

// Get WebSocket URL - matches the API base URL logic
function getWebSocketUrl() {
	if (!browser) return null;
	
	// Use the same logic as api.js
	// In production: https://reason-ink-api-production.up.railway.app
	// In development: http://localhost:3000
	const isProduction = browser && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
	
	if (isProduction) {
		// Production: use wss:// for secure WebSocket
		return 'wss://reason-ink-api-production.up.railway.app/cable';
	} else {
		// Development: use ws:// for local WebSocket
		return 'ws://localhost:3000/cable';
	}
}

async function loadActionCable() {
	if (!browser) return null;
	
	if (ActionCable) return ActionCable;
	
	try {
		// Dynamic import to avoid SSR issues
		const module = await import('@rails/actioncable');
		ActionCable = module.default || module;
		return ActionCable;
	} catch (e) {
		console.error('Failed to load @rails/actioncable. Please run: npm install @rails/actioncable', e);
		return null;
	}
}

export async function getCable() {
	if (!browser) return null;
	
	const ActionCableModule = await loadActionCable();
	if (!ActionCableModule) return null;

	const currentUser = get(user);
	if (!currentUser) return null;

	// Recreate cable if it doesn't exist
	if (!cable) {
		// Get WebSocket URL based on environment
		const baseWsUrl = getWebSocketUrl();
		if (!baseWsUrl) {
			console.error('Could not determine WebSocket URL');
			return null;
		}
		
		// Pass auth tokens as query parameters for WebSocket
		const wsUrl = `${baseWsUrl}?user_email=${encodeURIComponent(currentUser.email)}&user_token=${encodeURIComponent(currentUser.generated_token)}`;
		cable = ActionCableModule.createConsumer(wsUrl);
	}

	return cable;
}

export async function subscribeToChannel(channelName, params, callbacks) {
	if (!browser) return null;

	const cable = await getCable();
	if (!cable) return null;

	const channel = cable.subscriptions.create(
		{ channel: channelName, ...params },
		{
			connected() {
				console.log(`Connected to ${channelName}`, params);
				if (callbacks?.connected) callbacks.connected();
			},
			disconnected() {
				console.log(`Disconnected from ${channelName}`);
				if (callbacks?.disconnected) callbacks.disconnected();
			},
			received(data) {
				if (callbacks?.received) callbacks.received(data);
			}
		}
	);

	const key = `${channelName}_${JSON.stringify(params)}`;
	subscriptions[key] = channel;

	return channel;
}

export function unsubscribeFromChannel(channelName, params) {
	if (!browser) return;

	const key = `${channelName}_${JSON.stringify(params)}`;
	const channel = subscriptions[key];
	
	if (channel) {
		channel.unsubscribe();
		delete subscriptions[key];
	}
}

export function disconnectCable() {
	if (!browser || !cable) return;

	cable.disconnect();
	cable = null;
	subscriptions = {};
}

// Recreate cable when user changes
user.subscribe((currentUser) => {
	if (!browser) return;
	
	if (!currentUser && cable) {
		disconnectCable();
	} else if (currentUser && !cable) {
		// Cable will be created on next getCable() call
	}
});

