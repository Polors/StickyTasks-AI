import { Note, User, UserSettings, NoteColor, UserRole } from '../types';

const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('stickytasks-token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const authService = {
  async createUser(name: string, email: string, password: string, role: UserRole = 'user'): Promise<User> {
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create user');
    }

    return res.json();
  },

  async login(email: string, password: string): Promise<User> {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Check if response has content
      const text = await res.text();
      if (!text) {
        throw new Error('服务器返回空响应，请检查后端是否正常运行');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Invalid JSON response:', text);
        throw new Error('服务器返回了无效的响应格式');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('stickytasks-token', data.token);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    localStorage.removeItem('stickytasks-token');
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('stickytasks-token');
    if (!token) return null;

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        localStorage.removeItem('stickytasks-token');
        return null;
      }

      return res.json();
    } catch (error) {
      return null;
    }
  },

  async updateSettings(user: User, settings: UserSettings): Promise<User> {
    const res = await fetch(`${API_URL}/auth/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ settings }),
    });

    if (!res.ok) {
      throw new Error('Failed to update settings');
    }

    return res.json();
  },

  // Admin Only Methods
  async getAllUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }

    return res.json();
  },

  async deleteUser(email: string) {
    const res = await fetch(`${API_URL}/admin/users/${email}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to delete user');
    }
  }
};

export const storageService = {
  async getNotes(userId: string): Promise<Note[]> {
    const res = await fetch(`${API_URL}/notes`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.error('Failed to fetch notes:', res.status);
      return [];
    }

    return res.json();
  },

  async saveNotes(userId: string, notes: Note[]) {
    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(notes),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to save notes:', error);
        throw new Error(error.error || 'Failed to save notes');
      }

      return await res.json();
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  }
};