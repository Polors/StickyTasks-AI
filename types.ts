export enum NoteColor {
  Yellow = 'bg-paper-yellow',
  Blue = 'bg-paper-blue',
  Green = 'bg-paper-green',
  Pink = 'bg-paper-pink',
  Purple = 'bg-paper-purple',
  Orange = 'bg-paper-orange',
}

export type FontType = 'font-hand' | 'font-messy' | 'font-blocky' | 'font-sans';
export type UserRole = 'admin' | 'user';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  color: NoteColor;
  items: TodoItem[];
  rotation: number;
  zIndex: number;
  createdAt: number;
  position?: { x: number; y: number };
  font?: FontType;
}

export interface UserSettings {
  defaultFont: FontType;
  defaultColor: NoteColor;
  layoutMode?: 'grid' | 'free'; // grid = auto-arrange, free = drag anywhere
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  settings: UserSettings;
}

export interface AISuggestionResponse {
  tasks: string[];
}