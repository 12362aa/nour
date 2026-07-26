# -*- coding: utf-8 -*-
with open('src/store/useNourStore.ts', 'r', encoding='utf8') as f:
    code = f.read()

if 'favoriteNames:' not in code:
    code = code.replace('export interface NourState {', 'export interface NourState {\n  favoriteNames: number[];\n  toggleFavoriteName: (id: number) => void;')
    code = code.replace('const initialState = {', 'const initialState = {\n  favoriteNames: [],')
    
    # insert the function implementation
    action_impl = '''  toggleFavoriteName: (id) =>
    set((state) => {
      const exists = state.favoriteNames.includes(id);
      return {
        favoriteNames: exists
          ? state.favoriteNames.filter((x) => x !== id)
          : [...state.favoriteNames, id],
      };
    }),'''
    
    code = code.replace('  setLocationReady:', action_impl + '\n  setLocationReady:')
    
    with open('src/store/useNourStore.ts', 'w', encoding='utf8') as f:
        f.write(code)
    print("Added favoriteNames to useNourStore")
else:
    print("favoriteNames already exists")