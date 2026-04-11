'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface SearchContextValue {
  /** Current search query */
  query: string;
  /** Update the search query (debounced internally) */
  setQuery: (value: string) => void;
  /** Whether a page has registered to handle search */
  active: boolean;
  /** Called by a page to register as the search handler */
  register: (onSearch: (value: string) => void) => () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQueryState] = useState('');
  const [active, setActive] = useState(false);
  const handlerRef = useRef<((value: string) => void) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handlerRef.current?.(value);
    }, 300);
  }, []);

  const register = useCallback((onSearch: (value: string) => void) => {
    handlerRef.current = onSearch;
    setActive(true);
    return () => {
      handlerRef.current = null;
      setActive(false);
      setQueryState('');
    };
  }, []);

  return (
    <SearchContext value={{ query, setQuery, active, register }}>
      {children}
    </SearchContext>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
