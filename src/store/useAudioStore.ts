import { create } from 'zustand';
import type { LibraryBook } from '../data/library';

interface AudioState {
  currentBook: LibraryBook | null;
  isPlaying: boolean;
  playBook: (book: LibraryBook) => void;
  setIsPlaying: (playing: boolean) => void;
  close: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentBook: null,
  isPlaying: false,
  playBook: (book) => set({ currentBook: book, isPlaying: true }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  close: () => set({ currentBook: null, isPlaying: false }),
}));
