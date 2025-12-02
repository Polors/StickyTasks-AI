import React from 'react';
import { X, Check } from 'lucide-react';
import { UserSettings, FontType, NoteColor } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const FONTS: { id: FontType; name: string; label: string }[] = [
  { id: 'font-hand', name: 'Patrick Hand', label: 'Handwritten' },
  { id: 'font-messy', name: 'Kalam', label: 'Messy Ink' },
  { id: 'font-blocky', name: 'Architects Daughter', label: 'Marker' },
  { id: 'font-sans', name: 'Inter', label: 'Clean' },
];

const COLORS = [
  NoteColor.Yellow,
  NoteColor.Blue,
  NoteColor.Green,
  NoteColor.Pink,
  NoteColor.Purple,
  NoteColor.Orange,
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  if (!isOpen) return null;

  const [tempSettings, setTempSettings] = React.useState(settings);

  const handleSave = () => {
    onSave(tempSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-slate-800">Appearance Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Font Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Default Font Style</label>
            <div className="grid grid-cols-2 gap-3">
              {FONTS.map(font => (
                <button
                  key={font.id}
                  onClick={() => setTempSettings({ ...tempSettings, defaultFont: font.id })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${tempSettings.defaultFont === font.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className={`text-lg text-gray-800 ${font.id} leading-none mb-1`}>Sticky Note</div>
                  <div className="text-xs text-gray-500">{font.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Default Note Color</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setTempSettings({ ...tempSettings, defaultColor: color })}
                  className={`w-12 h-12 rounded-full shadow-sm border-2 transition-transform hover:scale-110 ${color} ${tempSettings.defaultColor === color ? 'border-purple-500 scale-110' : 'border-transparent'
                    }`}
                >
                  {tempSettings.defaultColor === color && (
                    <div className="flex items-center justify-center h-full">
                      <Check size={20} className="text-gray-800/50" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};