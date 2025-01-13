// lib/themes.ts
export type Theme = 'light' | 'dark' | 'kenya';

export interface ThemeConfig {
  name: Theme;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: 'Light',
    colors: {
      primary: '#ffffff',
      secondary: '#f3f4f6',
      accent: '#cc0000',
      background: '#ffffff',
      text: '#000000'
    }
  },
  dark: {
    name: 'dark',
    displayName: 'Dark',
    colors: {
      primary: '#1a1a1a',
      secondary: '#2d2d2d',
      accent: '#cc0000',
      background: '#121212',
      text: '#ffffff'
    }
  },
  kenya: {
    name: 'kenya',
    displayName: 'Kenya',
    colors: {
      primary: '#000000',
      secondary: '#cc0000',
      accent: '#006600',
      background: '#ffffff',
      text: '#000000'
    }
  }
};