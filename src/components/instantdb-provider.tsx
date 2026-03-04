'use client';

import { ReactNode } from 'react';
import { getDb } from '@/lib/db';

export function InstantDBProvider({ children }: { children: ReactNode }) {
  // Hook once to ensure provider side effects run in client
  const db = getDb();
  db.useAuth();
  return children;
}

