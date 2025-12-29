import React, { useState, useEffect } from 'react';
import { Plus, StickyNote, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { Note, NoteColor, TodoItem, User } from './types';
import { NoteCard } from './components/NoteCard';
import { AuthScreen } from './components/Auth';
import { SettingsModal } from './components/Settings';
import { AdminDashboard } from './components/AdminDashboard';
import { AIAssistant } from './components/AIAssistant';
import { UpdateLog } from './components/UpdateLog';
import { authService, storageService } from './services/storage';
import { generateUUID } from './utils/uuid';

const COLORS = [
  NoteColor.Yellow,
  NoteColor.Blue,
  NoteColor.Green,
  NoteColor.Pink,
  NoteColor.Purple,
  NoteColor.Orange,
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          await loadNotes(currentUser.id);
        }
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  // Auto-save notes whenever they change (Only for regular users)
  useEffect(() => {
    if (!user || user.role === 'admin') return;

    // Debounce save to avoid rapid consecutive saves
    const timeoutId = setTimeout(() => {
      storageService.saveNotes(user.id, notes).catch(err => {
        console.error('Failed to auto-save notes:', err);
      });
    }, 500); // Wait 500ms after last change before saving

    return () => clearTimeout(timeoutId);
  }, [notes, user]);

  const loadNotes = async (userId: string) => {
    console.log('[DEBUG] Loading notes for user:', userId);
    try {
      const savedNotes = await storageService.getNotes(userId);
      console.log('[DEBUG] Fetched notes:', savedNotes.length, savedNotes);

      if (savedNotes.length > 0) {
        setNotes(savedNotes);
        const maxZ = Math.max(...savedNotes.map((n) => n.zIndex || 0));
        setMaxZIndex(maxZ + 1);
        console.log('[DEBUG] Loaded existing notes');
      } else {
        // Empty start for new user
        console.log('[DEBUG] No notes found, creating welcome note');
        setNotes([]);
        // Optional: Add welcome note for new users
        const welcomeNote: Note = {
          id: generateUUID(),
          title: 'Welcome!',
          color: NoteColor.Yellow,
          items: [
            { id: '1', text: 'Create a new note', done: false },
            { id: '2', text: 'Check out Settings to change fonts', done: false },
          ],
          rotation: -2,
          zIndex: 1,
          createdAt: Date.now(),
        };
        setNotes([welcomeNote]);
        console.log('[DEBUG] Created welcome note, saving...');
        await storageService.saveNotes(userId, [welcomeNote]);
        console.log('[DEBUG] Welcome note saved');
      }
    } catch (error) {
      console.error('[ERROR] Failed to load notes:', error);
    }
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role !== 'admin') {
      await loadNotes(loggedInUser.id);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setNotes([]);
  };

  const handleUpdateSettings = async (newSettings: any) => {
    if (user) {
      try {
        const updatedUser = await authService.updateSettings(user, newSettings);
        setUser(updatedUser);
      } catch (error) {
        console.error("Failed to update settings", error);
      }
    }
  };

  const addNote = (title?: string, items?: TodoItem[]) => {
    const randomRotation = Math.random() * 6 - 3;

    // Always use a random color for new notes to prevent "white/transparent" issue and add variety
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const newNote: Note = {
      id: generateUUID(),
      title: title || 'Untitled',
      color: color,
      items: items || [],
      rotation: randomRotation,
      zIndex: maxZIndex + 1,
      createdAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setMaxZIndex((prev) => prev + 1);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const batchDeleteNotes = (ids: string[]) => {
    setNotes((prev) => prev.filter((note) => !ids.includes(note.id)));
  };

  const bringToFront = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, zIndex: maxZIndex + 1 } : note
      )
    );
    setMaxZIndex((prev) => prev + 1);
  };

  const moveNote = (id: string, newIndex: number) => {
    setNotes((prev) => {
      const currentIndex = prev.findIndex(n => n.id === id);
      if (currentIndex === -1) return prev;

      const newNotes = [...prev];
      const [note] = newNotes.splice(currentIndex, 1);
      // Clamp index to valid range
      const targetIndex = Math.max(0, Math.min(newIndex, prev.length - 1));
      newNotes.splice(targetIndex, 0, note);
      return newNotes;
    });
  };

  const swapNotes = (id1: string, id2: string) => {
    setNotes((prev) => {
      const idx1 = prev.findIndex(n => n.id === id1);
      const idx2 = prev.findIndex(n => n.id === id2);
      if (idx1 === -1 || idx2 === -1) return prev;

      const newNotes = [...prev];
      [newNotes[idx1], newNotes[idx2]] = [newNotes[idx2], newNotes[idx1]];
      return newNotes;
    });
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    if (!draggedNoteId || draggedNoteId === targetNoteId) return;

    const draggedIndex = notes.findIndex(n => n.id === draggedNoteId);
    const targetIndex = notes.findIndex(n => n.id === targetNoteId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newNotes = [...notes];
    const [draggedNote] = newNotes.splice(draggedIndex, 1);
    newNotes.splice(targetIndex, 0, draggedNote);

    setNotes(newNotes);
    setDraggedNoteId(null);
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
  };

  if (isAuthChecking) return null;

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // --- ROUTING LOGIC ---

  // If user is Admin, show Admin Dashboard
  if (user.role === 'admin') {
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  // If user is Regular User, show Sticky Notes App
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">


      {/* Navbar */}
      <nav className="sticky top-0 z-[1000] bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-300 p-2 rounded-lg shadow-sm -rotate-3 border border-yellow-400">
            <StickyNote className="text-yellow-800" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 hidden sm:block">
            StickyTasks <span className="text-purple-600 font-hand text-3xl ml-1">AI</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 mr-2 bg-gray-100/50 px-3 py-1.5 rounded-full border border-gray-200/50">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          <UpdateLog />

          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          <button
            onClick={() => addNote()}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Note</span>
          </button>
        </div>
      </nav>

      {/* Main Board */}
      <main className="flex-1 p-8 overflow-x-hidden">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 animate-float">
            <StickyNote size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-hand">Your desk is empty. Create a note!</p>
          </div>
        )}

        {/* Notes Grid - Always grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 auto-rows-max pb-20">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex justify-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, note.id)}
            >
              <NoteCard
                note={note}
                fontClass={user.settings.defaultFont}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onBringToFront={bringToFront}
                onDragStart={(e) => handleDragStart(e, note.id)}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={user.settings}
        onSave={handleUpdateSettings}
      />

      {/* AI Assistant */}
      <AIAssistant
        notes={notes}
        onAddNote={addNote}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
        onBatchDeleteNotes={batchDeleteNotes}
        onMoveNote={moveNote}
        onSwapNotes={swapNotes}
      />

      {/* Footer Info */}
      <footer className="fixed bottom-4 right-6 text-xs text-gray-400 font-medium pointer-events-none select-none">
        <p>StickyTasks AI • v2.0 • by cdq</p>
      </footer>
    </div>
  );
};

export default App;