import { useState, useEffect } from 'react';

export type ProjectView = 'grid' | 'list';

const PREFERENCES_KEY = 'csm-preferences';

interface Preferences {
  projectView: ProjectView;
}

const defaultPreferences: Preferences = {
  projectView: 'grid',
};

export const usePreferences = () => {
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences;
    
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    
    return defaultPreferences;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [preferences]);

  const setPreferences = (newPreferences: Partial<Preferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...newPreferences }));
  };

  const setProjectView = (view: ProjectView) => {
    setPreferences({ projectView: view });
  };

  return {
    preferences,
    setPreferences,
    setProjectView,
    projectView: preferences.projectView,
  };
};

