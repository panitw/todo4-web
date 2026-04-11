'use client';

import { useEffect } from 'react';

/**
 * Initializes @axe-core/react in development mode only.
 * Logs accessibility violations to the browser console.
 * This component renders nothing — it's a side-effect-only component.
 */
export function AxeDevTools() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      Promise.all([
        import('react'),
        import('react-dom'),
        import('@axe-core/react'),
      ]).then(([React, ReactDOM, axe]) => {
        // Spread into plain objects — React 19 ESM modules are frozen
        // and axe-core attempts to set properties on them.
        axe.default({ ...React }, { ...ReactDOM }, 1000);
      });
    }
  }, []);

  return null;
}
