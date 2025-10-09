// utils/ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context object
export const ThemeContext = createContext(null);

// Create the provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [accent, setAccent] = useState('lavender'); // default accent

  // Load saved theme and accent from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const savedAccent = await AsyncStorage.getItem('accent');
        if (savedTheme) setTheme(savedTheme);
        if (savedAccent) setAccent(savedAccent);
      } catch (error) {
        console.log('Error loading theme settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save theme + accent whenever they change
  useEffect(() => {
    AsyncStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    AsyncStorage.setItem('accent', accent);
  }, [accent]);

  // Simple theme toggle helper
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Provide values to all children
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};
