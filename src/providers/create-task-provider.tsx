'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface CreateTaskContextValue {
  /** Whether a page has registered to handle task creation */
  active: boolean;
  /** Trigger the registered create-task handler */
  trigger: () => void;
  /** Called by a page to register as the create-task handler */
  register: (onCreateTask: () => void) => () => void;
}

const CreateTaskContext = createContext<CreateTaskContextValue | null>(null);

export function CreateTaskProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const handlerRef = useRef<(() => void) | null>(null);

  const trigger = useCallback(() => {
    handlerRef.current?.();
  }, []);

  const register = useCallback((onCreateTask: () => void) => {
    handlerRef.current = onCreateTask;
    setActive(true);
    return () => {
      handlerRef.current = null;
      setActive(false);
    };
  }, []);

  return (
    <CreateTaskContext value={{ active, trigger, register }}>
      {children}
    </CreateTaskContext>
  );
}

export function useCreateTaskAction() {
  const ctx = useContext(CreateTaskContext);
  if (!ctx) throw new Error('useCreateTaskAction must be used within CreateTaskProvider');
  return ctx;
}
