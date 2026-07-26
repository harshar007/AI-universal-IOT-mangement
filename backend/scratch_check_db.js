const { Client } = require('pg');

const run = async () => {
  // Test connection with password prabha0312
  const client1 = new Client({
    connectionString: 'postgres://postgres:prabha0312@YOUR_SERVER_IP:5432/postgres'
  });
  
  // Test connection with password postgres
  const client2 = new Client({
    connectionString: 'postgres://postgres:postgres@YOUR_SERVER_IP:5432/postgres'
  });

  console.log('Attempting client 1 (password prabha0312)...');
  try {
    await client1.connect();
    console.log('Client 1 Connected successfully!');
    await checkSchema(client1);
    await client1.end();
    return;
  } catch (err) {
    console.error('Client 1 failed:', err.message);
  }

  console.log('Attempting client 2 (password postgres)...');
  try {
    await client2.connect();
    console.log('Client 2 Connected successfully!');
    await checkSchema(client2);
    await client2.end();
    return;
  } catch (err) {
    console.error('Client 2 failed:', err.message);
  }
};

const checkSchema = async (client) => {
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));

    // Check users table details
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('Columns in users table:', cols.rows);
  } catch (err) {
    console.error('Failed to query database schema:', err.message);
  }
};

run();
