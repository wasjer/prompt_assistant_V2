/**
 * Prompts 路由模块
 * 职责：处理 prompt 相关的 API 请求
 */

const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '../../data/promptvault.db');

/**
 * 将 YYYY-MM-DD 转为当日 0:00:00 UTC 时间戳（毫秒）
 */
function dateStringToStartMs(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00.000Z');
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * 将 YYYY-MM-DD 转为当日 23:59:59.999 UTC 时间戳（毫秒）
 */
function dateStringToEndMs(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T23:59:59.999Z');
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * GET /api/prompts
 * 查询参数：platform, keyword, startDate, endDate；按时间倒序返回
 */
router.get('/', (req, res) => {
  try {
    const { platform, keyword, startDate, endDate } = req.query;
    const conditions = [];
    const params = [];

    if (platform && String(platform).trim()) {
      conditions.push('url LIKE ?');
      params.push('%' + String(platform).trim() + '%');
    }
    if (keyword && String(keyword).trim()) {
      conditions.push('prompt LIKE ?');
      params.push('%' + String(keyword).trim() + '%');
    }
    const startMs = dateStringToStartMs(startDate);
    if (startMs != null) {
      conditions.push('ts >= ?');
      params.push(startMs);
    }
    const endMs = dateStringToEndMs(endDate);
    if (endMs != null) {
      conditions.push('ts <= ?');
      params.push(endMs);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM prompts ${whereClause} ORDER BY ts DESC`;
    const db = new Database(dbPath);
    const stmt = db.prepare(sql);
    const prompts = stmt.all(...params);
    db.close();

    res.json({
      success: true,
      count: prompts.length,
      data: prompts
    });
  } catch (error) {
    console.error('获取 Prompts 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/prompts/:id
 * 根据 ID 物理删除一条记录
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: '缺少 id' });
    }
    const db = new Database(dbPath);
    const stmt = db.prepare('DELETE FROM prompts WHERE id = ?');
    const result = stmt.run(id);
    db.close();
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }
    res.json({ success: true, message: '已删除' });
  } catch (error) {
    console.error('删除 Prompt 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/prompts
 * 接收来自插件的数据并保存到数据库
 */
router.post('/', (req, res) => {
  try {
    const { id, prompt, model, url, ts } = req.body;

    // 验证必填字段
    if (!prompt || !model || !url || !ts) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段: prompt, model, url, ts'
      });
    }

    // 连接数据库
    const db = new Database(dbPath);

    // 使用参数化查询防止 SQL 注入
    const stmt = db.prepare(`
      INSERT INTO prompts (id, model, url, ts, prompt, userId, flagged, hitTerms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 执行插入（id 使用传入的值，如果为 null 则使用自增）
    const result = stmt.run(
      id || null,        // id（如果提供则使用，否则自增）
      model,             // model
      url,               // url
      ts,                // ts
      prompt,            // prompt
      null,              // userId（暂时为 null）
      0,                 // flagged（默认 false）
      null               // hitTerms（暂时为 null）
    );

    // 关闭数据库连接
    db.close();

    // 返回成功响应
    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Prompt 保存成功'
    });
  } catch (error) {
    console.error('保存 Prompt 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
