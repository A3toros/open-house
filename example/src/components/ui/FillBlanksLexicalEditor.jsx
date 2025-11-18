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

// Toolbar component with Add Blank functionality
const ToolbarPlugin = ({ onAddBlank, blankCount }) => {
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

  // Add blank function - inserts blank at cursor position
  const insertBlank = useCallback(() => {
    if (!editor || !onAddBlank) return;
    
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Insert visual blank at cursor position
        const blankId = blankCount + 1;
        const blankText = `${blankId}_________`;
        const textNode = $createTextNode(blankText);
        textNode.setStyle('background-color: #f0f9ff; border: 1px dashed #3b82f6; padding: 2px 4px; border-radius: 4px; font-family: monospace;');
        selection.insertNodes([textNode]);
      }
    });
    
    // Call the parent's addBlank function
    onAddBlank();
  }, [editor, onAddBlank, blankCount]);

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
          className="px-2 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h2')}
          className="px-2 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h3')}
          className="px-2 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={formatParagraph}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Paragraph"
        >
          P
        </button>
        <button
          type="button"
          onClick={formatQuote}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Quote"
        >
          "
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
          •
        </button>
        <button
          type="button"
          onClick={insertNumberedList}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Numbered List"
        >
          1.
        </button>
        <button
          type="button"
          onClick={removeList}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Remove List"
        >
          ↶
        </button>
      </div>

      {/* Add Blank Button */}
      {onAddBlank && (
        <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
          <button
            type="button"
            onClick={insertBlank}
            className="px-3 py-1 text-sm font-medium bg-blue-500 text-white border border-blue-600 rounded hover:bg-blue-600 transition-colors"
            title="Add Blank"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline mr-1">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Blank
          </button>
        </div>
      )}
    </div>
  );
};

// Main Fill Blanks Lexical Editor component
const FillBlanksLexicalEditor = ({ value, onChange, placeholder, onAddBlank, blankCount = 0 }) => {
  const initialConfig = {
    namespace: 'FillBlanksLexicalEditor',
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
        <ToolbarPlugin onAddBlank={onAddBlank} blankCount={blankCount} />
        <OnChangePluginWrapper onChange={onChange} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="p-4 min-h-32 focus:outline-none"
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

export default FillBlanksLexicalEditor;
