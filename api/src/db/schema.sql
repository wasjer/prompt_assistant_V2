-- 创建 prompts 表
-- 遵循统一数据标准：id, userId, model, url, ts, prompt, flagged, hitTerms
-- 注意：id 使用 TEXT 类型存储 UUID 字符串，不使用自增整数

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,                  -- UUID 字符串（由前端生成）
  userId TEXT,                          -- 用户ID（未来扩展）
  model TEXT NOT NULL,                 -- AI模型名称（枚举值）
  url TEXT NOT NULL,                   -- 完整URL
  ts INTEGER NOT NULL,                 -- 时间戳（Unix timestamp，毫秒）
  prompt TEXT NOT NULL,                -- Prompt内容
  flagged BOOLEAN DEFAULT 0,          -- 是否命中敏感词（未来付费功能）
  hitTerms TEXT,                       -- 命中的敏感词列表（JSON数组字符串）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ts ON prompts(ts DESC);
CREATE INDEX IF NOT EXISTS idx_model ON prompts(model);
CREATE INDEX IF NOT EXISTS idx_flagged ON prompts(flagged);
