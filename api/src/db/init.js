/**
 * 数据库初始化模块
 * 职责：连接数据库，执行 schema.sql 创建表结构
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'promptvault.db');

/**
 * 初始化数据库
 */
function initDatabase() {
  try {
    // 如果 data 文件夹不存在，自动创建
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('已创建 data 目录:', dbDir);
    }

    // 连接数据库（如果不存在会自动创建）
    const db = new Database(dbPath);
    console.log('已连接数据库:', dbPath);

    // 如果表已存在但结构不匹配，删除旧表重新创建
    try {
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prompts'").get();
      if (tableInfo) {
        console.log('检测到已存在的 prompts 表，检查表结构...');
        // 检查 id 字段类型
        const columns = db.prepare("PRAGMA table_info(prompts)").all();
        const idColumn = columns.find(col => col.name === 'id');
        
        // 如果 id 字段是 INTEGER 类型（旧结构），删除表重新创建
        if (idColumn && idColumn.type.toUpperCase() === 'INTEGER') {
          console.log('检测到旧表结构（id 为 INTEGER），删除旧表重新创建...');
          db.exec('DROP TABLE IF EXISTS prompts');
          db.exec('DROP INDEX IF EXISTS idx_ts');
          db.exec('DROP INDEX IF EXISTS idx_model');
          db.exec('DROP INDEX IF EXISTS idx_flagged');
        }
      }
    } catch (error) {
      console.warn('检查表结构时出错，将尝试重新创建:', error.message);
      // 如果检查失败，直接删除表重新创建
      db.exec('DROP TABLE IF EXISTS prompts');
      db.exec('DROP INDEX IF EXISTS idx_ts');
      db.exec('DROP INDEX IF EXISTS idx_model');
      db.exec('DROP INDEX IF EXISTS idx_flagged');
    }

    // 读取 schema.sql 文件
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // 执行 SQL 语句（better-sqlite3 不支持多语句执行，需要分割）
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // 执行每个 SQL 语句
    db.exec('BEGIN TRANSACTION');
    try {
      for (const statement of statements) {
        db.exec(statement);
      }
      db.exec('COMMIT');
      console.log('数据库表结构初始化成功');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    // 关闭数据库连接
    db.close();
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行初始化
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
