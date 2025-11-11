import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Theme types
export type ThemePreference = 'modern' | 'elegant' | 'vibrant';
export type DarkMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemePreference;
  darkMode: DarkMode;
  setTheme: (theme: ThemePreference) => void;
  setDarkMode: (mode: DarkMode) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('theme-preference');
    return (saved as ThemePreference) || 'modern';
  });

  const [darkMode, setDarkModeState] = useState<DarkMode>(() => {
    const saved = localStorage.getItem('dark-mode');
    return (saved as DarkMode) || 'system';
  });

  const queryClient = useQueryClient();

  // Fetch user's theme preference from server
  const { isLoading } = useQuery({
    queryKey: ['/api/user/theme-preference'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/theme-preference', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.themePreference && data.themePreference !== theme) {
            setThemeState(data.themePreference);
          }
          return data;
        }
      } catch (error) {
        console.log('No server theme preference found, using local');
      }
      return { themePreference: theme };
    },
    retry: false, // Don't retry if user is not authenticated
  });

  // Mutation to update theme preference on server
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: ThemePreference) => {
      const response = await apiRequest('PUT', '/api/user/theme-preference', {
        themePreference: newTheme,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/theme-preference'] });
    },
    onError: (error) => {
      console.error('Failed to update theme preference:', error);
    },
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('modern', 'elegant', 'vibrant');
    
    // Add current theme class and data attribute
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    
    const applyDarkMode = () => {
      if (darkMode === 'dark' || (darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyDarkMode();
    localStorage.setItem('dark-mode', darkMode);

    // Listen for system theme changes if using system preference
    if (darkMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyDarkMode);
      return () => mediaQuery.removeEventListener('change', applyDarkMode);
    }
  }, [darkMode]);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    // Update server asynchronously
    updateThemeMutation.mutate(newTheme);
  };

  const setDarkMode = (mode: DarkMode) => {
    setDarkModeState(mode);
  };

  const value = {
    theme,
    darkMode,
    setTheme,
    setDarkMode,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}