import { init } from '@instantdb/react';
import schema from '../../instant.schema';

const APP_ID = '29031c31-34e3-4764-8e6e-1e2dec7aa2c2';

let client: ReturnType<typeof init> | null = null;

export function getDb() {
  if (!client) {
    client = init({
      appId: APP_ID,
      schema,
    });
  }
  return client;
}

