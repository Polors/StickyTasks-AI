import React, { useState, useRef, useEffect } from 'react';
import { History, X } from 'lucide-react';

interface UpdateLogProps {
    // No props needed for now, data is internal or imported
}

const UPDATES = [
    {
        version: 'v2.1',
        date: '2025-12-03',
        changes: [
            '新增小Tips，右键添加Tips，快来试一试吧',
        ]
    },
    {
        version: 'v2.0',
        date: '2025-12-01',
        changes: [
            'Released StickyTasks AI.',
            'Added AI Assistant with chat functionality.',
            'Added Drag & Drop reordering.',
            'Added Per-note settings (Color, Font).',
        ]
    }
];

export const UpdateLog: React.FC<UpdateLogProps> = () => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative z-[500]" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                title="Update Log"
            >
                <History size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Update Log</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto p-4 space-y-6">
                        {UPDATES.map((update, index) => (
                            <div key={index} className="relative pl-4 border-l-2 border-purple-100">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-purple-400 ring-4 ring-white"></div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-bold text-purple-600">{update.version}</span>
                                    <span className="text-xs text-gray-400">{update.date}</span>
                                </div>
                                <ul className="space-y-1">
                                    {update.changes.map((change, i) => (
                                        <li key={i} className="text-sm text-gray-600 leading-relaxed">
                                            • {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
