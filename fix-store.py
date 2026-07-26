# -*- coding: utf-8 -*-
with open('src/store/useNourStore.ts', 'r', encoding='utf8') as f:
    code = f.read()

code = code.replace('type NourState = {', 'type NourState = {\n  favoriteNames: number[];\n  toggleFavoriteName: (id: number) => void;')
code = code.replace('profile: null,', 'profile: null,\n  favoriteNames: [],')
code = code.replace('| "profile"', '| "profile"\n  | "favoriteNames"')
code = code.replace('setProfile,', 'setProfile,\n    favoriteNames,\n    toggleFavoriteName,')

action_impl = '''  toggleFavoriteName: (id) => {
    set((state) => {
      const exists = state.favoriteNames.includes(id);
      return {
        favoriteNames: exists
          ? state.favoriteNames.filter((x) => x !== id)
          : [...state.favoriteNames, id],
      };
    });
    void persist(get());
  },'''

code = code.replace('  setProfile: (profile) => {', action_impl + '\n  setProfile: (profile) => {')

with open('src/store/useNourStore.ts', 'w', encoding='utf8') as f:
    f.write(code)