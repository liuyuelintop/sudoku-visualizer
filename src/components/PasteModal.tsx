/**
 * @fileoverview Paste Modal - Advanced Sudoku Input Component
 *
 * Modern replacement for primitive prompt() dialog with support for multiple
 * data formats, real-time validation, and enhanced user experience.
 *
 * @features
 * - Multiple format support (9-line, single-line, CSV, grid)
 * - Real-time format detection and validation
 * - Visual preview of parsed grid
 * - Detailed error messages and format suggestions
 * - Responsive modal design with keyboard support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createBoardFromString } from '../utils/validation';
import type { Board } from '../types/sudoku';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (board: Board) => void;
}

/**
 * Advanced Sudoku input modal with multiple format support
 *
 * Supports the following input formats:
 * 1. 9-line format (current standard)
 * 2. Single-line 81-character string
 * 3. CSV format with commas/spaces
 * 4. Grid format with whitespace alignment
 */
const PasteModal: React.FC<PasteModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string>('');

  // Enhanced format detection and parsing
  const parseInput = useCallback((text: string) => {
    if (!text.trim()) {
      setPreview(null);
      setError(null);
      setDetectedFormat('');
      return;
    }

    // Try multiple parsing strategies
    const strategies = [
      // Strategy 1: Current 9-line format
      () => {
        const { board, validation } = createBoardFromString(text);
        if (board) {
          setDetectedFormat('9-line format');
          return { board, validation };
        }
        return null;
      },

      // Strategy 2: Single-line 81 characters
      () => {
        const cleaned = text.replace(/[^.1-9]/g, '');
        if (cleaned.length === 81) {
          const lines = [];
          for (let i = 0; i < 9; i++) {
            lines.push(cleaned.slice(i * 9, (i + 1) * 9));
          }
          const reconstructed = lines.join('\n');
          const { board, validation } = createBoardFromString(reconstructed);
          if (board) {
            setDetectedFormat('Single-line format (81 chars)');
            return { board, validation };
          }
        }
        return null;
      },

      // Strategy 3: CSV/space-separated format
      () => {
        const lines = text.trim().split(/\n|\r\n?/);
        if (lines.length >= 9) {
          const processedLines = lines.slice(0, 9).map(line => {
            return line.split(/[,\s]+/)
              .filter(cell => cell.length > 0)
              .map(cell => cell === '0' || cell === '' ? '.' : cell)
              .slice(0, 9)
              .join('');
          });

          if (processedLines.every(line => line.length === 9)) {
            const reconstructed = processedLines.join('\n');
            const { board, validation } = createBoardFromString(reconstructed);
            if (board) {
              setDetectedFormat('CSV/Grid format');
              return { board, validation };
            }
          }
        }
        return null;
      }
    ];

    // Try each strategy
    for (const strategy of strategies) {
      const result = strategy();
      if (result?.board) {
        setPreview(result.board);
        setError(result.validation.errors.length > 0 ? result.validation.errors[0] : null);
        return;
      }
    }

    // No strategy worked
    setPreview(null);
    setDetectedFormat('');
    setError('Unable to parse input. Please check format and try again.');
  }, []);

  // Parse input when text changes
  useEffect(() => {
    parseInput(input);
  }, [input, parseInput]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInput('');
      setPreview(null);
      setError(null);
      setDetectedFormat('');
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && preview) {
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, preview, onClose]);

  const handleConfirm = () => {
    if (preview) {
      onConfirm(preview);
      onClose();
    }
  };

  const exampleFormats = [
    {
      name: '9-Line Format',
      example: '53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79'
    },
    {
      name: 'Single Line (81 chars)',
      example: '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'
    },
    {
      name: 'CSV Format',
      example: '5,3,.,.,7,.,.,.,.\n6,.,.,1,9,5,.,.,.\n.,9,8,.,.,.,.,6,.\n8,.,.,.,6,.,.,.,3\n4,.,.,8,.,3,.,.,1\n7,.,.,.,2,.,.,.,6'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import Sudoku Puzzle</h2>
            <p className="text-sm text-gray-600 mt-1">
              Paste your puzzle in any supported format
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Puzzle Data
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your Sudoku puzzle here... (supports multiple formats)"
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />

            {/* Format Detection */}
            {detectedFormat && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">Detected format:</span>
                <span className="font-medium text-green-600">{detectedFormat}</span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-9 gap-1 w-fit mx-auto">
                  {preview.map((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`w-8 h-8 border border-gray-300 flex items-center justify-center text-sm font-medium ${
                          cell === '.'
                            ? 'bg-white text-gray-400'
                            : 'bg-blue-50 text-blue-900'
                        }`}
                      >
                        {cell === '.' ? '' : cell}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Format Examples */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Supported Formats</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {exampleFormats.map((format, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">{format.name}</h4>
                  <div className="bg-white p-2 rounded border">
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {format.example.length > 50
                        ? format.example.slice(0, 50) + '...'
                        : format.example
                      }
                    </pre>
                  </div>
                  <button
                    onClick={() => setInput(format.example)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Try this format
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!preview}
              className={`px-4 py-2 rounded-md transition-colors ${
                preview
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Import Puzzle {preview && '(Ctrl+Enter)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasteModal;