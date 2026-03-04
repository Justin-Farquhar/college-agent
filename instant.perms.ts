import type { InstantRules } from '@instantdb/react';

// Basic permissions:
// - Anyone can read schools (public data)
// - Authenticated users can read/write their own comparisons and saved_schools

const rules = {
  schools: {
    allow: {
      view: 'true',
    },
  },
  comparisons: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create: 'auth.id != null && auth.id == newData.userId',
      update: 'auth.id != null && auth.id == data.userId && auth.id == newData.userId',
      delete: 'auth.id != null && auth.id == data.userId',
    },
  },
  comparison_schools: {
    allow: {
      view: 'auth.id != null',
      create: 'auth.id != null',
      update: 'auth.id != null',
      delete: 'auth.id != null',
    },
  },
  saved_schools: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create: 'auth.id != null && auth.id == newData.userId',
      update: 'auth.id != null && auth.id == data.userId && auth.id == newData.userId',
      delete: 'auth.id != null && auth.id == data.userId',
    },
  },
} satisfies InstantRules;

export default rules;

