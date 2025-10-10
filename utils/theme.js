// utils/theme.js
// This is like your color palette - organized by light/dark mode and accent colors

const accentColors = {
  lavender: {
    primary: '#6A0DAD',
    light: '#8B5CF6',
    gradient: ['#E8B5E8', '#D9B8F5', '#F5C9E8', '#FAD9F1'],
  },
  ocean: {
    primary: '#0077BE',
    light: '#4A9FD8',
    gradient: ['#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6'],
  },
  forest: {
    primary: '#2E7D32',
    light: '#4CAF50',
    gradient: ['#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A'],
  },
  sunset: {
    primary: '#FF6B6B',
    light: '#FF8E8E',
    gradient: ['#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726'],
  },
  rose: {
    primary: '#C2185B',
    light: '#E91E63',
    gradient: ['#F8BBD0', '#F48FB1', '#F06292', '#EC407A'],
  },
};

const lightTheme = {
  // Background colors
  background: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.7)',
  surfaceSolid: '#FFFFFF',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // UI elements
  border: '#E0E0E0',
  divider: '#F0F0F0',
  shadow: 'rgba(0, 0, 0, 0.08)',
  
  // Semantic colors
  success: '#4CAF50',
  error: '#D32F2F',
  warning: '#FFA726',
  
  // Blob opacity (for decorative elements)
  blobOpacity: 0.15,
};

const darkTheme = {
  // Background colors
  background: '#121212',
  surface: 'rgba(30, 30, 30, 0.9)',
  surfaceSolid: '#1E1E1E',
  
  // Text colors
  text: '#E0E0E0',
  textSecondary: '#AAAAAA',
  textTertiary: '#777777',
  
  // UI elements
  border: '#333333',
  divider: '#2A2A2A',
  shadow: 'rgba(0, 0, 0, 0.5)',
  
  // Semantic colors
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FFB74D',
  
  // Blob opacity
  blobOpacity: 0.25,
};

// Function to get the complete theme object
export const getTheme = (mode = 'light', accentKey = 'lavender') => {
  const baseTheme = mode === 'light' ? lightTheme : darkTheme;
  const accent = accentColors[accentKey] || accentColors.lavender;
  
  return {
    ...baseTheme,
    accent: accent.primary,
    accentLight: accent.light,
    gradient: accent.gradient,
    mode,
  };
};

export const accentOptions = Object.keys(accentColors).map(key => ({
  key,
  name: key.charAt(0).toUpperCase() + key.slice(1),
  colors: accentColors[key],
}));