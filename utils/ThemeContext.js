// utils/ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from './theme';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const [accent, setAccent] = useState('lavender');
  
  const theme = getTheme(mode, accent);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        let savedMode = await AsyncStorage.getItem('theme_mode');
        let savedAccent = await AsyncStorage.getItem('theme_accent');
        
        if (!savedMode || !savedAccent) {
          const oldTheme = await AsyncStorage.getItem('app_theme');
          if (oldTheme) {
            const parsed = JSON.parse(oldTheme);
            
            if (parsed.mode) {
              savedMode = parsed.mode;
              await AsyncStorage.setItem('theme_mode', savedMode);
            }
            
            if (parsed.accent) {
              const accentMap = {
                '#6A0DAD': 'lavender',
                '#007AFF': 'ocean',
                '#34C759': 'forest',
                '#FF9500': 'sunset',
                '#FF2D55': 'rose',
              };
              savedAccent = accentMap[parsed.accent] || 'lavender';
              await AsyncStorage.setItem('theme_accent', savedAccent);
            }
            
            await AsyncStorage.removeItem('app_theme');
          }
        }
        
        if (savedMode) setMode(savedMode);
        if (savedAccent) setAccent(savedAccent);
      } catch (error) {
        console.log('Error loading theme settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('theme_mode', mode);
  }, [mode]);

  useEffect(() => {
    AsyncStorage.setItem('theme_accent', accent);
  }, [accent]);

  const toggleTheme = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme,
        mode,
        setMode,
        toggleTheme,
        accent,
        setAccent,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// ❌ DELETE EVERYTHING AFTER THIS LINE