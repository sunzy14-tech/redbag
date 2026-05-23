const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/db/pool');
const env = require('../src/config/env');

async function main() {
  const schema = await fs.readFile(path.resolve(__dirname, '../db/schema.sql'), 'utf8');
  const statements = schema.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) await query(statement);

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  await query(
    `INSERT INTO admins (username, password_hash, role)
     VALUES (:username, :passwordHash, 'admin')
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)`,
    { username: env.adminUsername, passwordHash }
  );

  const products = await query('SELECT id FROM products LIMIT 1');
  if (!products.length) {
    await query(
      `INSERT INTO products (name, sku, description)
       VALUES ('品牌瓶盖红包产品', 'REDBAG-SKU-001', '默认产品，可在后台 API 中新增')`
    );
  }

  const strategies = await query('SELECT id FROM redbag_strategies LIMIT 1');
  if (!strategies.length) {
    await query(
      `INSERT INTO redbag_strategies
        (name, type, win_rate, min_amount_cents, max_amount_cents, probability_rules, status)
       VALUES
        ('默认随机红包 0.3-8.8 元', 'random', 99.90, 30, 880, JSON_ARRAY(), 'enabled')`
    );
  }

  await pool.end();
  console.log('Database initialized');
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});

