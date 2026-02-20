<script>
	import Api from '$lib/api/api/api.js';
	import { onMount, onDestroy } from 'svelte';
	import TypewriterEditor from './TypewriterEditor.svelte';

	export let chapter;

	let timer;
	let notesEditable = false;
	let typewriterMode = true;
	let bodyWordCount = 0;

	// Out-loud read time: medium pace ≈ 150 WPM (conversational/audiobook range 130–160)
	const WPM_OUTLOUD_MEDIUM = 150;

	const formatReadTime = (totalSeconds) => {
		if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) return '0h 00m 00s';
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = Math.floor(totalSeconds % 60);
		const pad = (n) => (n < 10 ? '0' + n : String(n));
		return `${h}h ${pad(m)}m ${pad(s)}s`;
	};

	$: readTimeSeconds = typewriterMode ? (bodyWordCount / WPM_OUTLOUD_MEDIUM) * 60 : 0;
	$: readTimeFormatted = formatReadTime(readTimeSeconds);
	let youtubePlayer = null;
	let youtubePlayerId = 'youtube-player-' + Math.random().toString(36).substr(2, 9);
	let processedNotes = '';
	let notesContainer = null;
	let timestampRanges = [];
	let highlightInterval = null;
	let activeLineIndex = -1;
	let videoId = '';

	// Parse timestamp (HH:MM:SS or MM:SS) to seconds
	const parseTimestamp = (timestamp) => {
		const parts = timestamp.split(':').map(Number);
		if (parts.length === 3) {
			// HH:MM:SS
			return parts[0] * 3600 + parts[1] * 60 + parts[2];
		} else if (parts.length === 2) {
			// MM:SS
			return parts[0] * 60 + parts[1];
		}
		return 0;
	};

	// Extract video ID from URL
	const getVideoId = (url) => {
		if (!url) return '';
		if (url.includes('v=')) {
			return url.split('v=')[1]?.split('&')[0] || '';
		} else if (url.includes('youtu.be/')) {
			return url.split('youtu.be/')[1]?.split('?')[0] || '';
		} else {
			return url.split('/').pop()?.split('?')[0] || '';
		}
	};

	// Process notes HTML to make timestamps clickable and identify timestamp ranges
	const processNotes = (html) => {
		if (!html) return '';
		
		// Extract timestamp ranges from the raw HTML text
		const textContent = html.replace(/<[^>]*>/g, ''); // Strip HTML tags for parsing
		timestampRanges = [];
		
		// Match timestamps like 00:00:36, 00:00:00-00:00:39, etc.
		const timestampRegex = /(\d{1,2}:\d{2}(?::\d{2})?)(?:-(\d{1,2}:\d{2}(?::\d{2})?))?/g;
		let match;
		while ((match = timestampRegex.exec(textContent)) !== null) {
			const startTime = parseTimestamp(match[1]);
			const endTime = match[2] ? parseTimestamp(match[2]) : startTime + 10; // Default 10 seconds if no end time
			timestampRanges.push({
				start: startTime,
				end: endTime,
				timestamp: match[0]
			});
		}
		
		// Make timestamps clickable
		const timestampRegex2 = /(\d{1,2}:\d{2}(?::\d{2})?)/g;
		return html.replace(timestampRegex2, (match) => {
			return `<span class="timestamp" data-seconds="${parseTimestamp(match)}">${match}</span>`;
		});
	};

	// Highlight the line that matches the current video time
	const updateHighlight = () => {
		if (!youtubePlayer || notesEditable || !notesContainer) return;
		
		try {
			const currentTime = youtubePlayer.getCurrentTime();
			let newActiveIndex = -1;
			
			// Find which timestamp range we're in
			for (let i = 0; i < timestampRanges.length; i++) {
				const range = timestampRanges[i];
				if (currentTime >= range.start && currentTime <= range.end) {
					newActiveIndex = i;
					break;
				}
			}
			
			// If no exact match, find the closest upcoming timestamp
			if (newActiveIndex === -1) {
				for (let i = 0; i < timestampRanges.length; i++) {
					if (currentTime < timestampRanges[i].start) {
						newActiveIndex = i - 1;
						break;
					}
				}
				if (newActiveIndex === -1 && timestampRanges.length > 0) {
					newActiveIndex = timestampRanges.length - 1;
				}
			}
			
			if (newActiveIndex !== activeLineIndex) {
				activeLineIndex = newActiveIndex;
				
				// Remove all existing highlights
				const timestamps = notesContainer.querySelectorAll('.timestamp');
				timestamps.forEach((timestamp) => {
					timestamp.classList.remove('active-timestamp');
				});
				const lines = notesContainer.querySelectorAll('.active-line');
				lines.forEach((line) => {
					line.classList.remove('active-line');
				});
				
				// Highlight matching timestamps and their parent lines
				if (newActiveIndex >= 0 && newActiveIndex < timestampRanges.length) {
					const range = timestampRanges[newActiveIndex];
					timestamps.forEach((timestamp) => {
						const seconds = parseInt(timestamp.dataset.seconds);
						if (seconds >= range.start && seconds <= range.end) {
							timestamp.classList.add('active-timestamp');
							// Find and highlight the parent element (paragraph or list item)
							let parent = timestamp.parentElement;
							while (parent && parent !== notesContainer) {
								if (parent.tagName === 'P' || parent.tagName === 'LI' || parent.tagName === 'DIV') {
									parent.classList.add('active-line');
									break;
								}
								parent = parent.parentElement;
							}
						}
					});
				}
			}
		} catch (e) {
			// Player might not be ready
			console.log('Player not ready:', e);
		}
	};

	// Initialize YouTube player
	const initYouTubePlayer = () => {
		if (!videoId || typeof window === 'undefined' || !window.YT) return;
		
		// Get the container element to calculate dimensions
		const container = document.getElementById(youtubePlayerId);
		if (!container) {
			setTimeout(initYouTubePlayer, 100);
			return;
		}
		
		const containerWidth = container.parentElement?.offsetWidth || 640;
		const height = Math.round(containerWidth * 0.5625); // 16:9 aspect ratio
		const width = containerWidth;
		
		// Wait for YouTube API to be ready
		if (window.YT.Player) {
			try {
				youtubePlayer = new window.YT.Player(youtubePlayerId, {
					height: height,
					width: width,
					videoId: videoId,
					playerVars: {
						playsinline: 1
					},
					events: {
						onReady: (event) => {
							// Start checking current time every 0.5 seconds
							highlightInterval = setInterval(() => {
								updateHighlight();
							}, 500);
						},
						onStateChange: (event) => {
							// Update highlight when video state changes
							if (event.data === window.YT.PlayerState.PLAYING) {
								if (!highlightInterval) {
									highlightInterval = setInterval(() => {
										updateHighlight();
									}, 500);
								}
							} else {
								if (highlightInterval) {
									clearInterval(highlightInterval);
									highlightInterval = null;
								}
							}
						}
					}
				});
			} catch (e) {
				console.error('Error initializing YouTube player:', e);
			}
		} else {
			// Wait for API to load
			setTimeout(initYouTubePlayer, 100);
		}
	};

	// Seek YouTube video to timestamp
	const seekToTimestamp = (seconds) => {
		if (!youtubePlayer) return;
		try {
			youtubePlayer.seekTo(seconds, true);
		} catch (e) {
			console.error('Error seeking:', e);
		}
	};

	// Handle timestamp click
	const handleTimestampClick = (e) => {
		if (e.target.classList.contains('timestamp')) {
			e.preventDefault();
			const seconds = parseInt(e.target.dataset.seconds);
			seekToTimestamp(seconds);
		}
	};

	const saveField = (field, value) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const updated = await Api.put(`/chapters/${chapter.id}`, {
				chapter: {
					[field]: value
				}
			});
			chapter[field] = updated[field];
			if (field === 'notes' && !notesEditable) {
				processedNotes = processNotes(chapter.notes || '');
			}
			if (field === 'youtube_url') {
				// Reinitialize player if URL changes
				videoId = getVideoId(chapter.youtube_url);
				if (youtubePlayer) {
					try {
						youtubePlayer.destroy();
					} catch (e) {
						console.error('Error destroying player:', e);
					}
					youtubePlayer = null;
				}
				setTimeout(() => {
					initYouTubePlayer();
				}, 100);
			}
		}, 1000);
	};

	// Update processed notes when notes change
	$: if (chapter.notes && !notesEditable) {
		processedNotes = processNotes(chapter.notes);
	}

	// Update video ID when youtube_url changes
	$: if (chapter.youtube_url) {
		videoId = getVideoId(chapter.youtube_url);
	}

	onMount(() => {
		if (chapter.notes && !notesEditable) {
			processedNotes = processNotes(chapter.notes);
		}
		if (chapter.youtube_url) {
			videoId = getVideoId(chapter.youtube_url);
		}
		
		// Make YouTube API ready function global if not already
		if (typeof window !== 'undefined' && !window.onYouTubeIframeAPIReady) {
			window.onYouTubeIframeAPIReady = () => {
				if (videoId) {
					setTimeout(() => {
						initYouTubePlayer();
					}, 100);
				}
			};
		}
		
		// Initialize player if API is already loaded
		if (typeof window !== 'undefined' && window.YT && window.YT.Player && videoId) {
			setTimeout(() => {
				initYouTubePlayer();
			}, 100);
		}
	});

	onDestroy(() => {
		if (highlightInterval) {
			clearInterval(highlightInterval);
		}
		if (youtubePlayer) {
			try {
				youtubePlayer.destroy();
			} catch (e) {
				console.error('Error destroying player:', e);
			}
		}
	});
</script>

<svelte:window />

<section class="wrapper">
	<h1
		class="title"
		contenteditable=""
		on:keyup={(e) => saveField('title', e.target.textContent)}>{chapter.title || 'Untitled Chapter'}</h1
	>

	<div class="typewriter-switch-row">
		<label class="typewriter-switch-label">
			<span class="typewriter-switch-text">Typewriter</span>
			<input
				type="checkbox"
				class="typewriter-switch-input"
				bind:checked={typewriterMode}
				aria-label="Toggle typewriter mode"
			/>
			<span class="typewriter-switch-slider"></span>
		</label>
	</div>

	{#if typewriterMode}
		<div class="read-time-bar" role="status" aria-live="polite">
			<span class="read-time-label">Read aloud</span>
			<span class="read-time-value">{readTimeFormatted}</span>
		</div>
	{/if}

	<div class="field-section">
		<label class="field-label">Body</label>
		{#if typewriterMode}
			<div class="field-content body-field typewriter-wrap">
				<TypewriterEditor
					content={chapter.body || ''}
					onSave={(html) => saveField('body', html)}
					bind:wordCount={bodyWordCount}
				/>
			</div>
		{:else}
			<div
				class="field-content body-field"
				contenteditable=""
				on:keyup={(e) => saveField('body', e.target.innerHTML)}>{@html chapter.body || ''}</div
			>
		{/if}
	</div>

	<div class="field-section">
		<div class="field-label-row">
			<label class="field-label">Notes</label>
			<button
				class="pen-button"
				class:active={notesEditable}
				on:click={() => {
					notesEditable = !notesEditable;
					if (!notesEditable && chapter.notes) {
						processedNotes = processNotes(chapter.notes);
					}
				}}
				title={notesEditable ? 'Toggle to read-only mode' : 'Toggle to edit mode'}
			>
				<i class="fa fa-pen"></i>
			</button>
		</div>
		{#if notesEditable}
			<div
				class="field-content notes-field"
				contenteditable=""
				on:keyup={(e) => saveField('notes', e.target.innerHTML)}>{@html chapter.notes || ''}</div
			>
		{:else}
			<div
				class="field-content notes-field notes-readonly"
				bind:this={notesContainer}
				on:click={handleTimestampClick}
			>{@html processedNotes || chapter.notes || ''}</div
			>
		{/if}
	</div>

	<div class="field-section">
		<label class="field-label">YouTube URL</label>
		<input
			type="text"
			class="field-input"
			bind:value={chapter.youtube_url}
			on:keyup={(e) => saveField('youtube_url', e.target.value)}
			placeholder="Enter YouTube URL..."
		/>
		{#if chapter.youtube_url && videoId}
			<div class="youtube-embed">
				<div id={youtubePlayerId}></div>
			</div>
		{/if}
	</div>
</section>

<style>
	.wrapper {
		background: #fff;
		padding: 30px;
		border-radius: 10px;
		position: relative;
	}

	.title {
		padding: 40px 0px;
		font-size: 32px;
		font-weight: 700;
		outline: none;
		cursor: text;
		border-bottom: 2px solid transparent;
		transition: border-color 0.2s ease;
	}

	.title:hover {
		border-bottom-color: #ddd;
	}

	.title:focus {
		border-bottom-color: #97b1ff;
	}

	.typewriter-switch-row {
		margin-bottom: 20px;
	}

	.typewriter-switch-label {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		user-select: none;
	}

	.typewriter-switch-text {
		font-size: 15px;
		font-weight: 600;
		color: #444;
	}

	.typewriter-switch-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.typewriter-switch-slider {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		background: #ccc;
		border-radius: 24px;
		transition: background 0.25s ease;
	}

	.typewriter-switch-slider::after {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		left: 2px;
		top: 2px;
		background: #fff;
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: transform 0.25s ease;
	}

	.typewriter-switch-input:checked + .typewriter-switch-slider {
		background: #97b1ff;
	}

	.typewriter-switch-input:checked + .typewriter-switch-slider::after {
		transform: translateX(20px);
	}

	.read-time-bar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		margin: 0 -30px 20px -30px;
		padding-left: 30px;
		padding-right: 30px;
		background: linear-gradient(to bottom, #f8f9fc 0%, #f0f2f8 100%);
		border-bottom: 1px solid #e2e6ee;
		font-size: 14px;
		box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.read-time-label {
		color: #666;
		font-weight: 500;
	}

	.read-time-value {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: #333;
		letter-spacing: 0.02em;
	}

	.typewriter-wrap {
		padding: 0;
		overflow: hidden;
	}

	.typewriter-wrap :global(.typewriter-editor) {
		border: none;
		background: transparent;
	}

	.field-section {
		margin-bottom: 32px;
	}

	.field-label {
		display: block;
		font-size: 18px;
		font-weight: 600;
		color: #666;
		margin-bottom: 12px;
	}

	.field-label-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.field-label-row .field-label {
		margin-bottom: 0;
	}

	.pen-button {
		background: #ffd700;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #333;
		font-size: 14px;
		padding: 0;
	}

	.pen-button:hover {
		background: #ffed4e;
		transform: scale(1.1);
	}

	.pen-button.active {
		background: #ff6b6b;
		color: #fff;
	}

	.pen-button.active:hover {
		background: #ff5252;
	}

	.field-content {
		min-height: 100px;
		padding: 16px;
		border: 1px solid #ddd;
		border-radius: 8px;
		outline: none;
		background: #fafafa;
	}

	.field-content:focus {
		background: #fff;
		border-color: #97b1ff;
		box-shadow: 0 0 0 3px rgba(151, 177, 255, 0.1);
	}

	.body-field {
		font-size: 16px;
		line-height: 1.6;
	}

	.notes-field {
		font-size: 14px;
		color: #555;
	}

	.notes-readonly {
		cursor: default;
		user-select: text;
	}

	.notes-readonly :global(.timestamp) {
		color: #4a90e2;
		cursor: pointer;
		text-decoration: underline;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.notes-readonly :global(.timestamp:hover) {
		color: #357abd;
		background-color: #e3f2fd;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.notes-readonly :global(.timestamp.active-timestamp) {
		background-color: #ffd700;
		color: #000;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.notes-readonly :global(.active-line) {
		background-color: rgba(255, 215, 0, 0.2);
		padding: 4px 8px;
		border-radius: 4px;
		transition: background-color 0.3s ease;
	}

	.field-input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 16px;
		outline: none;
		box-sizing: border-box;
		margin-bottom: 16px;
	}

	.field-input:focus {
		border-color: #97b1ff;
		box-shadow: 0 0 0 3px rgba(151, 177, 255, 0.1);
	}

	.youtube-embed {
		margin-top: 16px;
		width: 100%;
		border-radius: 8px;
		overflow: hidden;
	}

	.youtube-embed > div {
		width: 100%;
		max-width: 100%;
	}

	@media (max-width: 480px) {
		.wrapper {
			padding: 20px;
		}

		.title {
			padding: 20px 0;
			font-size: 24px;
		}
	}
</style>
