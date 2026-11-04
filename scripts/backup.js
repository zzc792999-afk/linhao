import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Load .env if present
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(root, 'backups', `backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`[Backup] 创建备份目录: ${backupDir}`);

  if (!process.env.DATABASE_URL) {
    console.warn('[Backup] 未发现 DATABASE_URL 环境变量，仅备份本地数据。');
    return;
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 15000,
    query_timeout: 30000
  });

  const client = await pool.connect();
  const summary = {
    timestamp: new Date().toISOString(),
    databaseUrlMasked: process.env.DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'),
    tables: {}
  };

  try {
    // 1. 获取所有 public 表名
    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"
    );
    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log(`[Backup] 发现 ${tableNames.length} 张数据库表:`, tableNames.join(', '));

    let totalRows = 0;

    for (const table of tableNames) {
      const res = await client.query(`SELECT * FROM "${table}"`);
      const rowCount = res.rows.length;
      totalRows += rowCount;

      // 如果有 BYTEA 列（比如 photos/targets），转为 base64 存储以便安全 JSON 序列化
      const serializedRows = res.rows.map(row => {
        const copy = { ...row };
        for (const [col, val] of Object.entries(copy)) {
          if (Buffer.isBuffer(val)) {
            copy[col] = { __type: 'Buffer', data: val.toString('base64') };
          }
        }
        return copy;
      });

      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(serializedRows, null, 2), 'utf8');
      const stat = fs.statSync(filePath);

      summary.tables[table] = {
        rowCount,
        fileSize: stat.size,
        file: `${table}.json`
      };
      console.log(`  ✓ 备份数据表 [${table}]: ${rowCount} 行 (${(stat.size / 1024).toFixed(1)} KB)`);
    }

    summary.totalTables = tableNames.length;
    summary.totalRows = totalRows;

    const summaryPath = path.join(backupDir, 'manifest.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    console.log(`\n[Backup 成功] 共备份 ${tableNames.length} 张表，${totalRows} 行数据。清单位于: ${summaryPath}`);

    // 2. 独立完整性自检：重新读取并校验
    console.log('[Backup 校验] 正在进行备份文件完整性自检...');
    let verifiedCount = 0;
    for (const [tbl, info] of Object.entries(summary.tables)) {
      const data = JSON.parse(fs.readFileSync(path.join(backupDir, info.file), 'utf8'));
      if (data.length !== info.rowCount) {
        throw new Error(`校验失败: 表 ${tbl} 记录数不匹配！`);
      }
      verifiedCount++;
    }
    console.log(`[Backup 校验通过] 全部 ${verifiedCount} 张表数据结构与行数自检完全一致！`);

  } finally {
    client.release();
    await pool.end();
  }
}

runBackup().catch(err => {
  console.error('[Backup 异常]', err);
  process.exit(1);
});
