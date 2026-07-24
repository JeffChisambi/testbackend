import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    async adapter(env: Record<string, string | undefined>) {
      const pool = mariadb.createPool({ uri: env['DATABASE_URL'] });
      return new PrismaMariaDb(pool);
    },
  },
});
