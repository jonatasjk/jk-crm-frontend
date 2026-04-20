import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Minus,
} from 'lucide-react';
import { cn } from '@/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minHeight?: number;
  /** Clickable placeholder tags shown next to the label, e.g. ['{{first_name}}', '{{last_name}}'] */
  tags?: string[];
  /** Pass ref to get the editor HTML value imperatively (for react-hook-form) */
  name?: string;
}

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={cn(
      'p-1.5 rounded text-gray-600 hover:bg-gray-200 transition-colors',
      active && 'bg-gray-200 text-gray-900',
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-300 mx-0.5 self-center" />;

export interface RichTextEditorHandle {
  getHTML: () => string;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ value = '', onChange, placeholder, label, error, minHeight = 200, tags }, ref) => {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: false, autolink: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      content: value,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2',
          ...(placeholder ? { 'data-placeholder': placeholder } : {}),
        },
      },
      onUpdate({ editor }) {
        const html = editor.getHTML();
        // Treat a document with only an empty paragraph as empty string
        const empty = editor.isEmpty ? '' : html;
        onChangeRef.current?.(editor.isEmpty ? '' : empty || html);
      },
    });

    // Expose getHTML for imperative access (react-hook-form Controller pattern)
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? '',
    }));

    // Sync external value changes (e.g. when modal opens with existing content)
    useEffect(() => {
      if (!editor) return;
      const current = editor.getHTML();
      if (value !== current) {
        editor.commands.setContent(value || '');
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const addLink = () => {
      if (!editor) return;
      const url = window.prompt('URL', editor.getAttributes('link').href ?? 'https://');
      if (url === null) return;
      if (url === '') {
        editor.chain().focus().unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {tags && tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor?.chain().focus().insertContent(tag).run();
                }}
                className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-mono transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div
          className={cn(
            'rounded-lg border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-shadow',
            error ? 'border-red-400' : 'border-gray-300',
          )}
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
            {/* History */}
            <ToolbarButton title="Undo" onClick={() => editor?.chain().focus().undo().run()}>
              <Undo size={14} />
            </ToolbarButton>
            <ToolbarButton title="Redo" onClick={() => editor?.chain().focus().redo().run()}>
              <Redo size={14} />
            </ToolbarButton>

            <Divider />

            {/* Headings */}
            <ToolbarButton
              title="Heading 2"
              active={editor?.isActive('heading', { level: 2 })}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              active={editor?.isActive('heading', { level: 3 })}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 size={14} />
            </ToolbarButton>

            <Divider />

            {/* Inline marks */}
            <ToolbarButton
              title="Bold"
              active={editor?.isActive('bold')}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              active={editor?.isActive('italic')}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              active={editor?.isActive('underline')}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Link"
              active={editor?.isActive('link')}
              onClick={addLink}
            >
              <LinkIcon size={14} />
            </ToolbarButton>

            <Divider />

            {/* Alignment */}
            <ToolbarButton
              title="Align left"
              active={editor?.isActive({ textAlign: 'left' })}
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Align center"
              active={editor?.isActive({ textAlign: 'center' })}
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Align right"
              active={editor?.isActive({ textAlign: 'right' })}
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight size={14} />
            </ToolbarButton>

            <Divider />

            {/* Lists */}
            <ToolbarButton
              title="Bullet list"
              active={editor?.isActive('bulletList')}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Ordered list"
              active={editor?.isActive('orderedList')}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered size={14} />
            </ToolbarButton>
            <ToolbarButton
              title="Horizontal rule"
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            >
              <Minus size={14} />
            </ToolbarButton>
          </div>

          {/* Content area */}
          <EditorContent
            editor={editor}
            style={{ minHeight }}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
RichTextEditor.displayName = 'RichTextEditor';
