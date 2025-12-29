import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User } from 'lucide-react';
import { Note, TodoItem } from '../types';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AIAssistantProps {
    notes: Note[];
    onAddNote: (title: string, items: TodoItem[]) => void;
    onUpdateNote: (id: string, updates: Partial<Note>) => void;
    onDeleteNote: (id: string) => void;
    onBatchDeleteNotes: (ids: string[]) => void;
    onMoveNote: (id: string, index: number) => void;
    onSwapNotes: (id1: string, id2: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote, onBatchDeleteNotes, onMoveNote, onSwapNotes }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! I\'m your StickyTasks assistant. I can help you organize your notes or answer questions about them. How can I help?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isOpen &&
                chatContainerRef.current &&
                !chatContainerRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare context: include IDs for actions
            const context = notes.map(n => ({
                id: n.id,
                title: n.title,
                items: n.items.map(i => ({ id: i.id, text: i.text, done: i.done })),
                color: n.color
            }));

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                    context
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            let content = data.choices[0].message.content;

            // Check for action block
            const actionBlockRegex = /```json\s*(\{[\s\S]*?"action":\s*"[\w_]+"[\s\S]*?\})\s*```/;
            const match = content.match(actionBlockRegex);

            if (match) {
                try {
                    const actionData = JSON.parse(match[1]);
                    console.log('AI Action:', actionData);

                    switch (actionData.action) {
                        case 'create_note': {
                            // Convert string items to TodoItems
                            const todoItems = (actionData.items || []).map((text: string) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                text,
                                done: false
                            }));
                            onAddNote(actionData.title, todoItems);
                            content += "\n\n(✅ New note created successfully!)";
                            break;
                        }

                        case 'update_note': {
                            if (actionData.id) {
                                const updates: Partial<Note> = {};
                                if (actionData.title !== undefined) updates.title = actionData.title;
                                if (actionData.color !== undefined) {
                                    const colorMap: Record<string, string> = {
                                        '#ffeb3b': 'bg-paper-yellow',
                                        '#a7f3d0': 'bg-paper-green',
                                        '#bfdbfe': 'bg-paper-blue',
                                        '#fbcfe8': 'bg-paper-pink',
                                        '#ddd6fe': 'bg-paper-purple',
                                        '#fed7aa': 'bg-paper-orange',
                                    };
                                    // fuzzy match or exact match
                                    updates.color = (colorMap[actionData.color] || actionData.color) as any;
                                }

                                onUpdateNote(actionData.id, updates);
                                content += "\n\n(✅ Note updated.)";
                            }
                            break;
                        }

                        case 'delete_note': {
                            if (actionData.id) {
                                onDeleteNote(actionData.id);
                                content += "\n\n(🗑️ Note deleted.)";
                            }
                            break;
                        }

                        case 'delete_notes_bulk': {
                            if (actionData.ids && Array.isArray(actionData.ids)) {
                                const count = actionData.ids.length;
                                if (count > 0) {
                                    const confirmed = window.confirm(`⚠️ Warning: Batch Deletion\n\nAre you sure you want to delete ${count} notes?`);
                                    if (confirmed) {
                                        onBatchDeleteNotes(actionData.ids);
                                        content += `\n\n(🗑️ Successfully deleted ${count} notes.)`;
                                    } else {
                                        content += "\n\n(❌ Deletion cancelled by user.)";
                                    }
                                }
                            }
                            break;
                        }

                        case 'move_note': {
                            if (actionData.id && actionData.position !== undefined) {
                                let targetIndex = 0;
                                if (actionData.position === 'start' || actionData.position === 'top' || actionData.position === 'first') {
                                    targetIndex = 0;
                                } else if (actionData.position === 'end' || actionData.position === 'bottom' || actionData.position === 'last') {
                                    targetIndex = notes.length - 1;
                                } else if (typeof actionData.position === 'number') {
                                    targetIndex = actionData.position;
                                }
                                onMoveNote(actionData.id, targetIndex);
                                content += "\n\n(✅ Note moved.)";
                            }
                            break;
                        }

                        case 'swap_notes': {
                            if (actionData.id1 && actionData.id2) {
                                onSwapNotes(actionData.id1, actionData.id2);
                                content += "\n\n(✅ Notes swapped.)";
                            }
                            break;
                        }

                        case 'add_task': {
                            if (actionData.noteId && actionData.task) {
                                const note = notes.find(n => n.id === actionData.noteId);
                                if (note) {
                                    const newItem = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        text: actionData.task,
                                        done: false
                                    };
                                    onUpdateNote(actionData.noteId, { items: [...note.items, newItem] });
                                    content += "\n\n(✅ Task added.)";
                                }
                            }
                            break;
                        }

                        case 'delete_task': {
                            if (actionData.noteId && actionData.taskId) {
                                const note = notes.find(n => n.id === actionData.noteId);
                                if (note) {
                                    const newItems = note.items.filter(i => i.id !== actionData.taskId);
                                    onUpdateNote(actionData.noteId, { items: newItems });
                                    content += "\n\n(🗑️ Task deleted.)";
                                }
                            }
                            break;
                        }

                        case 'update_task': {
                            if (actionData.noteId && actionData.taskId) {
                                const note = notes.find(n => n.id === actionData.noteId);
                                if (note) {
                                    const newItems = note.items.map(i => {
                                        if (i.id === actionData.taskId) {
                                            const updatedItem = { ...i };
                                            if (actionData.text !== undefined) updatedItem.text = actionData.text;
                                            if (actionData.done !== undefined) updatedItem.done = actionData.done;
                                            return updatedItem;
                                        }
                                        return i;
                                    });
                                    onUpdateNote(actionData.noteId, { items: newItems });
                                    content += "\n\n(✅ Task updated.)";
                                }
                            }
                            break;
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse action block", e);
                }
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: content
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-[9999] ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <MessageCircle size={28} />
            </button>

            {/* Chat Window */}
            <div
                ref={chatContainerRef}
                className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 z-[9999] overflow-hidden ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
                style={{ height: '600px', maxHeight: 'calc(100vh - 48px)' }}
            >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">StickyTasks AI</h3>
                            <p className="text-xs text-white/80">Powered by LongCat</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about your notes..."
                            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
