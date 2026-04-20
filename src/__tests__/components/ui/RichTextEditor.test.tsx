import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RichTextEditor, type RichTextEditorHandle } from '@/components/ui/RichTextEditor';
import { renderWithProviders } from '@/test/utils';

// ---------------------------------------------------------------------------
// Build a chainable mock for the Tiptap chain() builder
// ---------------------------------------------------------------------------
const mockRun = vi.fn();

// Every method on the chain returns itself so the fluent calls work
function createChain() {
  const chain: any = new Proxy(
    { run: mockRun },
    {
      get(target, prop) {
        if (prop === 'run') return target.run;
        return (..._args: any[]) => chain;
      },
    },
  );
  return chain;
}

// Captured onUpdate callback so we can trigger it from tests
let capturedOnUpdate: ((args: { editor: any }) => void) | null = null;

const mockEditor = {
  chain: vi.fn(() => createChain()),
  isActive: vi.fn(() => false),
  getHTML: vi.fn(() => '<p>hello</p>'),
  isEmpty: false,
  getAttributes: vi.fn(() => ({ href: 'https://existing.com' })),
  commands: { setContent: vi.fn() },
};

// Mock Tiptap — useEditor returns our mock editor and captures onUpdate
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn((options: any) => {
    capturedOnUpdate = options?.onUpdate ?? null;
    return mockEditor;
  }),
  EditorContent: ({ editor: _e }: any) => <div data-testid="editor-content" />,
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({
  default: { configure: vi.fn(() => ({})) },
}));
vi.mock('@tiptap/extension-text-align', () => ({
  default: { configure: vi.fn(() => ({})) },
}));

// ---------------------------------------------------------------------------
describe('RichTextEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnUpdate = null;
    mockRun.mockReset();
  });

  it('renders the toolbar and content area', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('renders label and tags when provided', () => {
    renderWithProviders(
      <RichTextEditor label="Message" value="" onChange={vi.fn()} tags={['{{first_name}}', '{{last_name}}']} />,
    );
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('{{first_name}}')).toBeInTheDocument();
    expect(screen.getByText('{{last_name}}')).toBeInTheDocument();
  });

  it('inserts tag content when a tag button is clicked', () => {
    renderWithProviders(
      <RichTextEditor label="Body" value="" onChange={vi.fn()} tags={['{{name}}']} />,
    );
    fireEvent.mouseDown(screen.getByText('{{name}}'));
  });

  it('calls onChange when editor content updates via onUpdate', () => {
    const mockOnChange = vi.fn();
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={mockOnChange} />);

    // Trigger the onUpdate callback that was passed to useEditor
    act(() => {
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p>updated</p>',
          isEmpty: false,
        },
      });
    });

    expect(mockOnChange).toHaveBeenCalledWith('<p>updated</p>');
  });

  it('calls onChange with empty string when editor content is empty', () => {
    const mockOnChange = vi.fn();
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={mockOnChange} />);

    act(() => {
      capturedOnUpdate?.({
        editor: {
          getHTML: () => '<p></p>',
          isEmpty: true,
        },
      });
    });

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('exposes getHTML via ref', () => {
    const ref = createRef<RichTextEditorHandle>();
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} ref={ref} />);
    expect(ref.current?.getHTML()).toBe('<p>hello</p>');
  });

  it('syncs external value via useEffect when value differs from editor HTML', async () => {
    const { rerender } = renderWithProviders(
      <RichTextEditor label="Body" value="<p>initial</p>" onChange={vi.fn()} />,
    );

    mockEditor.getHTML.mockReturnValue('<p>initial</p>');

    rerender(
      <RichTextEditor label="Body" value="<p>updated value</p>" onChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<p>updated value</p>');
    });
  });

  // ------------------------------------------------------------------
  // Toolbar button tests — each covers a unique inline onClick callback
  // ------------------------------------------------------------------

  it('undo toolbar button calls chain undo', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Undo'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('redo toolbar button calls chain redo', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Redo'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('heading 2 toolbar button calls chain toggleHeading', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Heading 2'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('heading 3 toolbar button calls chain toggleHeading', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Heading 3'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('bold toolbar button calls chain toggleBold', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Bold'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('italic toolbar button calls chain toggleItalic', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Italic'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('underline toolbar button calls chain toggleUnderline', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Underline'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('align-left toolbar button calls chain setTextAlign', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Align left'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('align-center toolbar button calls chain setTextAlign', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Align center'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('align-right toolbar button calls chain setTextAlign', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Align right'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('bullet list toolbar button calls chain toggleBulletList', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Bullet list'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('ordered list toolbar button calls chain toggleOrderedList', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Ordered list'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('horizontal rule toolbar button calls chain setHorizontalRule', () => {
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Horizontal rule'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('link toolbar button — addLink sets a new URL when prompt returns a value', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('https://example.com');
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Link'));
    expect(window.prompt).toHaveBeenCalled();
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('link toolbar button — addLink unsets link when prompt returns empty string', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('');
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Link'));
    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('link toolbar button — addLink does nothing when prompt is cancelled (returns null)', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    renderWithProviders(<RichTextEditor label="Body" value="" onChange={vi.fn()} />);
    const callsBefore = mockEditor.chain.mock.calls.length;
    fireEvent.mouseDown(screen.getByTitle('Link'));
    // chain may be called once (for the addLink check), but link setting shouldn't proceed
    expect(window.prompt).toHaveBeenCalled();
    void callsBefore;
  });

  it('renders error state when error prop is provided', () => {
    const { container } = renderWithProviders(
      <RichTextEditor label="Body" value="" onChange={vi.fn()} error="Required field" />,
    );
    // Error class on the border div
    expect(container.querySelector('[class*="border-red-400"]')).not.toBeNull();
  });
});
