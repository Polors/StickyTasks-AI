import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Check, X, Sparkles, Loader2, Settings2, GripVertical } from 'lucide-react';
import { Note, TodoItem, FontType, NoteColor } from '../types';
import { generateUUID } from '../utils/uuid';
import { breakDownTaskWithGemini } from '../services/geminiService';

interface NoteCardProps {
  note: Note;
  fontClass: FontType;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

interface TodoItemRowProps {
  item: TodoItem;
  fontClass: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
}

const TodoItemRow: React.FC<TodoItemRowProps> = ({ item, fontClass, onToggle, onDelete, onUpdateText }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text);

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== item.text) {
      onUpdateText(item.id, text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <li className="flex items-start gap-2 group/item">
      <button
        onClick={() => onToggle(item.id)}
        className={`mt-1 min-w-[1.25rem] h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.done ? 'border-gray-500 bg-gray-500/20' : 'border-gray-600 hover:border-black'
          }`}
      >
        {item.done && <Check size={12} className="text-gray-700" />}
      </button>

      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`${fontClass} text-xl leading-6 flex-1 bg-white/50 px-2 py-1 rounded border-2 border-blue-400 focus:outline-none focus:border-blue-600 text-gray-800 w-full min-w-0`}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`${fontClass} text-xl leading-6 flex-1 break-words transition-all duration-300 cursor-text ${item.done ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
        >
          {item.text}
        </span>
      )}

      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
      >
        <X size={14} />
      </button>
    </li>
  );
};

export const NoteCard: React.FC<NoteCardProps> = ({ note, fontClass, onUpdate, onDelete, onBringToFront, onDragStart, onDragEnd }) => {
  const [newItemText, setNewItemText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(note.title);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus input when editing title
  const titleInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleDragStart = (e: React.DragEvent) => {
    if (cardRef.current) {
      // Set the drag image to the entire card
      const rect = cardRef.current.getBoundingClientRect();
      // Center the drag image or use click offset? 
      // Default behavior is usually fine, but let's try to set it explicitly if needed.
      // For now, just setting the element is enough.
      e.dataTransfer.setDragImage(cardRef.current, 0, 0);
    }
    onDragStart?.(e);
  };

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: TodoItem = {
      id: generateUUID(),
      text: newItemText.trim(),
      done: false,
    };

    onUpdate(note.id, { items: [...note.items, newItem] });
    setNewItemText('');
  };

  const handleToggleItem = (itemId: string) => {
    const updatedItems = note.items.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdate(note.id, { items: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = note.items.filter(item => item.id !== itemId);
    onUpdate(note.id, { items: updatedItems });
  };

  const handleUpdateItemText = (itemId: string, newText: string) => {
    const updatedItems = note.items.map(item =>
      item.id === itemId ? { ...item, text: newText } : item
    );
    onUpdate(note.id, { items: updatedItems });
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() !== note.title) {
      onUpdate(note.id, { title: titleInput.trim() || 'Untitled' });
    }
  };

  const handleGenerateTasks = async () => {
    if (!note.title || note.title === 'Untitled') return;
    setIsGenerating(true);
    try {
      const suggestions = await breakDownTaskWithGemini(note.title);
      const newItems: TodoItem[] = suggestions.map(text => ({
        id: generateUUID(),
        text,
        done: false
      }));
      onUpdate(note.id, { items: [...note.items, ...newItems] });
    } catch (error) {
      console.error("Failed to generate tasks", error);
      alert("Could not generate tasks automatically. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Settings dropdown
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const colors = [
    { name: 'Yellow', value: NoteColor.Yellow },
    { name: 'Blue', value: NoteColor.Blue },
    { name: 'Green', value: NoteColor.Green },
    { name: 'Pink', value: NoteColor.Pink },
    { name: 'Purple', value: NoteColor.Purple },
    { name: 'Orange', value: NoteColor.Orange },
  ];

  const fonts: Array<{ name: string; value: FontType }> = [
    { name: 'Hand', value: 'font-hand' },
    { name: 'Messy', value: 'font-messy' },
    { name: 'Blocky', value: 'font-blocky' },
  ];

  const currentFont = note.font || fontClass;

  return (
    <div
      ref={cardRef}
      className={`relative flex flex-col w-72 h-80 p-5 shadow-lg transition-transform duration-300 hover:scale-105 hover:z-50 ${note.color}`}
      style={{
        transform: `rotate(${note.rotation}deg)`,
        zIndex: note.zIndex,
      }}
      onClick={() => onBringToFront(note.id)}
    >
      {/* Tape Effect */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-sm rotate-1 shadow-sm border border-white/20"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-3 mt-2 group">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {/* Drag Handle */}
          <div
            className="note-drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
          >
            <GripVertical size={16} />
          </div>

          {/* Title */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
              className={`bg-white/50 px-2 py-1 rounded border-2 border-blue-400 text-xl font-bold ${currentFont} w-full focus:outline-none focus:border-blue-600 text-gray-800`}
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className={`text-2xl font-bold ${currentFont} text-gray-800 cursor-text truncate w-full pr-2 hover:bg-black/5 rounded px-1 transition-colors`}
            >
              {note.title}
            </h3>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen(!isSettingsOpen);
              }}
              className="text-gray-500 hover:text-gray-800 transition-colors p-1"
              title="Settings"
            >
              <Settings2 size={18} />
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Color</p>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          onUpdate(note.id, { color: color.value });
                          setIsSettingsOpen(false);
                        }}
                        className={`w-8 h-8 rounded-full ${color.value} border-2 ${note.color === color.value ? 'border-gray-800' : 'border-gray-300'} hover:scale-110 transition-transform`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Font</p>
                  <div className="space-y-1">
                    {fonts.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => {
                          onUpdate(note.id, { font: font.value });
                          setIsSettingsOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded ${currentFont === font.value ? 'bg-gray-200' : 'hover:bg-gray-100'} ${font.value} text-sm transition-colors`}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(note.id)}
            className="text-gray-500 hover:text-red-600 transition-colors p-1"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* List Items */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {note.items.length === 0 && !isGenerating && (
          <div className={`flex flex-col items-center justify-center h-full text-gray-500 ${currentFont} text-lg opacity-60`}>
            <p>Empty list...</p>
            {note.title && note.title !== 'Untitled' && (
              <button
                onClick={handleGenerateTasks}
                className="mt-4 flex items-center gap-2 px-3 py-1 bg-white/50 hover:bg-white/80 rounded-full transition-colors text-sm shadow-sm font-sans"
              >
                <Sparkles size={14} className="text-purple-600" />
                <span>Auto-fill</span>
              </button>
            )}
          </div>
        )}

        {isGenerating && (
          <div className={`flex flex-col items-center justify-center h-full text-gray-600 ${currentFont} animate-pulse`}>
            <Loader2 className="animate-spin mb-2" size={24} />
            <p>Thinking...</p>
          </div>
        )}

        <ul className="space-y-2">
          {note.items.map((item) => (
            <TodoItemRow
              key={item.id}
              item={item}
              fontClass={currentFont}
              onToggle={handleToggleItem}
              onDelete={handleDeleteItem}
              onUpdateText={handleUpdateItemText}
            />
          ))}
        </ul>
      </div>

      {/* Input Footer */}
      <form onSubmit={handleAddItem} className="mt-3 relative">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add a task..."
          className={`w-full bg-black/5 border-none rounded-lg px-3 py-2 pr-9 ${currentFont} text-lg focus:ring-1 focus:ring-black/20 focus:outline-none placeholder:text-gray-500`}
        />
        <button
          type="submit"
          disabled={!newItemText.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 disabled:opacity-30"
        >
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
};