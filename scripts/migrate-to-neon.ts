import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
import { SqliteAdapter } from '../db/sqlite';
import { PostgresAdapter } from '../db/postgres';

async function migrate() {
  const connectionString = (
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''
  ).trim();

  if (!connectionString) {
    console.error('❌ Error: No DATABASE_URL found in .env.');
    console.error('Please add your Neon connection string to .env before running migration:');
    console.error('DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"');
    process.exit(1);
  }

  console.log('🔄 Initializing SQLite source database (bills.sqlite)...');
  const sqlite = new SqliteAdapter('bills.sqlite');
  await sqlite.init();

  console.log('🔌 Connecting to Neon / PostgreSQL target database...');
  const postgres = new PostgresAdapter(connectionString);
  await postgres.init();

  const bills = await sqlite.listBills();
  console.log(`📦 Found ${bills.length} bill(s) in local SQLite database.`);

  if (bills.length === 0) {
    console.log('Nothing to migrate.');
    await sqlite.close();
    await postgres.close();
    return;
  }

  let count = 0;
  for (const b of bills) {
    const fullBill = await sqlite.getBill(b.id);
    if (!fullBill) continue;

    console.log(`  ➡️ Migrating bill: "${fullBill.data.name || fullBill.id}" (${fullBill.id})...`);
    await postgres.saveBill(fullBill.id, fullBill.data);
    count++;
  }

  console.log(`\n🎉 Successfully migrated ${count} bill(s) to Neon PostgreSQL!`);
  await sqlite.close();
  await postgres.close();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message || err);
  process.exit(1);
});
