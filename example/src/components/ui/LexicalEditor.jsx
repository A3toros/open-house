import React, { useCallback, useEffect, useContext } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { TRANSFORMERS } from '@lexical/markdown';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $getRoot, $createParagraphNode, $createTextNode, $isRangeSelection, $isTextNode, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND } from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';

// OnChange Plugin to handle editor content changes
const OnChangePluginWrapper = ({ onChange }) => {
const [editor] = useContext(LexicalComposerContext) || [];

  useEffect(() => {
    if (onChange && editor) {
      return editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const root = $getRoot();
          const textContent = root.getTextContent();
          // Get the full editor state as JSON to preserve formatting
          const editorStateJSON = editorState.toJSON();
          onChange(JSON.stringify(editorStateJSON));
        });
      });
    }
  }, [editor, onChange]);

  return null;
};

// Toolbar component
const ToolbarPlugin = () => {
  const [editor] = useContext(LexicalComposerContext) || [];

  // Text formatting functions
  const formatBold = useCallback(() => {
    if (!editor) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }, [editor]);

  const formatItalic = useCallback(() => {
    if (!editor) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  }, [editor]);

  const formatUnderline = useCallback(() => {
    if (!editor) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  }, [editor]);

  const formatStrikethrough = useCallback(() => {
    if (!editor) return;
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  }, [editor]);

  // Heading functions
  const formatHeading = useCallback((headingSize) => {
    if (!editor) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  }, [editor]);

  const formatParagraph = useCallback(() => {
    if (!editor) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  }, [editor]);

  const formatQuote = useCallback(() => {
    if (!editor) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }, [editor]);

  // List functions
  const insertBulletList = useCallback(() => {
    if (!editor) return;
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
  }, [editor]);

  const insertNumberedList = useCallback(() => {
    if (!editor) return;
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
  }, [editor]);

  const removeList = useCallback(() => {
    if (!editor) return;
    editor.dispatchCommand(REMOVE_LIST_COMMAND);
  }, [editor]);

  // Text color functions
  const setTextColor = useCallback((color) => {
    if (!editor) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            node.setStyle(`color: ${color}`);
          }
        });
      }
    });
  }, [editor]);

  // Font size functions
  const setFontSize = useCallback((size) => {
    if (!editor) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Apply font size to selected text by updating text nodes
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const currentStyle = node.getStyle();
            
            // Remove existing font-size and add new one
            const cleanedStyle = currentStyle 
              ? currentStyle.replace(/font-size:\s*\d+px;?\s*/g, '').trim()
              : '';
            const newStyle = cleanedStyle 
              ? `${cleanedStyle}; font-size: ${size}px;`
              : `font-size: ${size}px;`;
            
            node.setStyle(newStyle);
          }
        });
      }
    });
  }, [editor]);

  // Text alignment functions
  const setTextAlign = useCallback((alignment) => {
    if (!editor) return;
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={formatBold}
          className="px-2 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={formatItalic}
          className="px-2 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-200"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={formatUnderline}
          className="px-2 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-200"
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={formatStrikethrough}
          className="px-2 py-1 text-sm line-through border border-gray-300 rounded hover:bg-gray-200"
          title="Strikethrough"
        >
          S
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={() => formatHeading('h1')}
          className="px-2 py-1 text-xs font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h2')}
          className="px-2 py-1 text-xs font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h3')}
          className="px-2 py-1 text-xs font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={formatParagraph}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Paragraph"
        >
          P
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={insertBulletList}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={insertNumberedList}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Numbered List"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={removeList}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Remove List"
        >
          No List
        </button>
      </div>

      {/* Text Color */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <span className="text-xs text-gray-600">Color:</span>
        <button
          type="button"
          onClick={() => setTextColor('#000000')}
          className="w-6 h-6 bg-black border border-gray-300 rounded hover:bg-gray-800"
          title="Black"
        />
        <button
          type="button"
          onClick={() => setTextColor('#ff0000')}
          className="w-6 h-6 bg-red-500 border border-gray-300 rounded hover:bg-red-600"
          title="Red"
        />
        <button
          type="button"
          onClick={() => setTextColor('#0000ff')}
          className="w-6 h-6 bg-blue-500 border border-gray-300 rounded hover:bg-blue-600"
          title="Blue"
        />
        <button
          type="button"
          onClick={() => setTextColor('#008000')}
          className="w-6 h-6 bg-green-500 border border-gray-300 rounded hover:bg-green-600"
          title="Green"
        />
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <span className="text-xs text-gray-600">Size:</span>
        <button
          type="button"
          onClick={() => setFontSize(12)}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Small"
        >
          12px
        </button>
        <button
          type="button"
          onClick={() => setFontSize(16)}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Normal"
        >
          16px
        </button>
        <button
          type="button"
          onClick={() => setFontSize(20)}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Large"
        >
          20px
        </button>
        <button
          type="button"
          onClick={() => setFontSize(24)}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Extra Large"
        >
          24px
        </button>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">Align:</span>
        <button
          type="button"
          onClick={() => setTextAlign('left')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Align Left"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => setTextAlign('center')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Align Center"
        >
          ↔
        </button>
        <button
          type="button"
          onClick={() => setTextAlign('right')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
          title="Align Right"
        >
          →
        </button>
      </div>
    </div>
  );
};

// Main Lexical Editor component
const LexicalEditor = ({ value, onChange, placeholder }) => {
  const initialConfig = {
    namespace: 'LexicalEditor',
    theme: {
      root: 'p-4 min-h-32 focus:outline-none',
      paragraph: 'mb-2',
      heading: {
        h1: 'text-3xl font-bold mb-4',
        h2: 'text-2xl font-bold mb-3',
        h3: 'text-xl font-bold mb-2',
      },
      quote: 'border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2',
      list: {
        nested: {
          listitem: 'list-none',
        },
        ol: 'list-decimal list-inside mb-2',
        ul: 'list-disc list-inside mb-2',
        listitem: 'mb-1',
      },
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
    onError: (error) => {
      console.error('Lexical error:', error);
    },
    editorState: value ? (() => {
      try {
        // Try to parse as JSON first (for existing formatted content)
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed);
      } catch {
        // If not JSON, treat as plain text and create basic structure
        return JSON.stringify({
          root: {
            children: [{
              children: [{
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: value,
                type: "text",
                version: 1
              }],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1
            }],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1
          }
        });
      }
    })() : undefined,
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <OnChangePluginWrapper onChange={onChange} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="p-4 min-h-32 focus:outline-none"
                placeholder={placeholder}
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </LexicalComposer>
    </div>
  );
};

// Export the main component and additional utilities
export default LexicalEditor;

// Export individual components for advanced usage
export { ToolbarPlugin, OnChangePluginWrapper };

// Export types for TypeScript users (if needed)
export const LexicalEditorProps = {
  value: 'string',
  onChange: 'function',
  placeholder: 'string'
};
