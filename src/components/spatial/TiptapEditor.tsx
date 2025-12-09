// TiptapEditor - Rich text editor for spatial cards
// Basic formatting: bold, italic, lists, headings

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface TiptapEditorProps {
  content: string
  onUpdate: (content: string) => void
  onBlur?: () => void
  editable: boolean
}

export function TiptapEditor({ content, onUpdate, onBlur, editable }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 40px;',
      },
    },
  })

  // Update editor content when prop changes (from external updates)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Update editable state and focus when becoming editable
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
      // Auto-focus and place cursor at end when entering edit mode
      if (editable) {
        setTimeout(() => {
          editor.commands.focus('end')
        }, 10)
      }
    }
  }, [editable, editor])

  if (!editor) {
    return null
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror {
          font-family: var(--sans-serif-font);
          font-size: var(--base-font-size);
          line-height: var(--base-line-height);
          color: var(--primary);
        }

        .ProseMirror p {
          margin: 0;
        }

        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 0.5em 0;
        }

        .ProseMirror h2 {
          font-size: 1.3em;
          font-weight: 600;
          margin: 0.4em 0;
        }

        .ProseMirror h3 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 0.3em 0;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror li {
          margin: 0.2em 0;
        }

        .ProseMirror strong {
          font-weight: 700;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror code {
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .ProseMirror pre {
          background: rgba(0, 0, 0, 0.05);
          padding: 8px;
          border-radius: 4px;
          overflow-x: auto;
        }

        .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        .ProseMirror blockquote {
          border-left: 3px solid var(--primary-border);
          padding-left: 1em;
          margin: 0.5em 0;
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}
