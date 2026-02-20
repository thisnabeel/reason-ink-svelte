<script>
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { StarterKit } from '@tiptap/starter-kit';

	export let content = '';
	export let onSave = (_html) => {};
	export let wordCount = 0;

	let editorElement;
	let editor;
	let saveTimer;

	const countWords = (text) => {
		if (!text || typeof text !== 'string') return 0;
		return text
			.trim()
			.split(/\s+/)
			.filter((w) => w.length > 0).length;
	};

	const scheduleSave = () => {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			if (editor) {
				const html = editor.getHTML();
				onSave(html);
			}
		}, 1000);
	};

	onMount(() => {
		editor = new Editor({
			element: editorElement,
			extensions: [StarterKit],
			content: content || '<p></p>',
			editorProps: {
				attributes: {
					class: 'typewriter-editor-inner'
				}
			},
			onTransaction: () => {
				if (!editor) return;
				wordCount = countWords(editor.getText());
				scheduleSave();
				editor = editor; // force re-render for toolbar active states
			}
		});
		wordCount = countWords(editor.getText());
	});

	onDestroy(() => {
		clearTimeout(saveTimer);
		if (editor) {
			onSave(editor.getHTML());
			editor.destroy();
			editor = null;
		}
	});

	// Sync content when chapter.body changes externally (e.g. when switching away from typewriter)
	$: if (editor && content !== undefined && !editor.isFocused) {
		const current = editor.getHTML();
		if (content !== current) {
			editor.commands.setContent(content || '<p></p>', false);
			wordCount = countWords(editor.getText());
		}
	}
</script>

<div class="typewriter-editor">
	{#if editor}
		<div class="typewriter-toolbar" role="toolbar" aria-label="Formatting">
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('bold')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
				title="Bold"
			>B</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('italic')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
				title="Italic"
			>I</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('strike')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
				title="Strikethrough"
			>S</button>
			<span class="toolbar-sep" aria-hidden="true"></span>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('heading', { level: 1 })}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
				title="Heading 1"
			>H1</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('heading', { level: 2 })}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
				title="Heading 2"
			>H2</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('heading', { level: 3 })}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
				title="Heading 3"
			>H3</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('paragraph')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); }}
				title="Paragraph"
			>P</button>
			<span class="toolbar-sep" aria-hidden="true"></span>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('bulletList')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
				title="Bullet list"
			>• List</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('orderedList')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
				title="Numbered list"
			>1. List</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('blockquote')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}
				title="Quote"
			>Quote</button>
			<button
				type="button"
				class="toolbar-btn"
				class:active={editor.isActive('code')}
				on:mousedown={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run(); }}
				title="Inline code"
			>Code</button>
		</div>
	{/if}
	<div class="typewriter-editor-body" bind:this={editorElement}></div>
</div>

<style>
	.typewriter-editor {
		min-height: 200px;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		background: #fafafa;
	}

	.typewriter-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px;
		padding: 8px 10px;
		background: #f0f0f0;
		border-bottom: 1px solid #ddd;
	}

	.toolbar-btn {
		min-width: 32px;
		height: 32px;
		padding: 0 8px;
		border: none;
		border-radius: 4px;
		background: transparent;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		color: #444;
		transition: background 0.15s, color 0.15s;
	}

	.toolbar-btn:hover {
		background: #e0e0e0;
		color: #222;
	}

	.toolbar-btn.active {
		background: #97b1ff;
		color: #fff;
	}

	.toolbar-btn.active:hover {
		background: #7a9aff;
	}

	.toolbar-sep {
		width: 1px;
		height: 20px;
		background: #ccc;
		margin: 0 4px;
	}

	.typewriter-editor-body {
		min-height: 180px;
	}

	.typewriter-editor :global(.typewriter-editor-inner) {
		min-height: 160px;
		padding: 16px;
		font-size: 16px;
		line-height: 1.6;
		outline: none;
	}

	.typewriter-editor :global(.ProseMirror p) {
		margin: 0 0 0.75em;
	}

	.typewriter-editor :global(.ProseMirror p:last-child) {
		margin-bottom: 0;
	}

	.typewriter-editor :global(.ProseMirror:focus) {
		outline: none;
	}
</style>
