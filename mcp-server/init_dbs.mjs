import pg from 'pg';

async function main() {
  const rootClient = new pg.Client({ connectionString: 'postgres://postgres:prabha0312@localhost:5432/postgres' });
  await rootClient.connect();

  const dbs = ['user_db', 'nexus_iot_db'];
  for (const db of dbs) {
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = '${db}'`);
    if (res.rows.length === 0) {
      await rootClient.query(`CREATE DATABASE ${db}`);
      console.log(`Created database: ${db}`);
    } else {
      console.log(`Database already exists: ${db}`);
    }
  }

  // Check tables in postgres database
  const tables = await rootClient.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log('Tables in postgres DB:', tables.rows.map(r => r.table_name));

  await rootClient.end();
}

main().catch(console.error);
