/**
 * API 通信模块
 * 职责：封装与后端 API 的通信逻辑
 * 注意：此模块在 Background Service Worker 中运行，不受页面 CSP 限制
 */

/**
 * 发送 prompt 数据到后端 API
 * @param {Object} data - 要发送的数据对象
 * @returns {Promise<Object>} 返回服务器响应数据
 */
async function sendPromptToAPI(data) {
  const apiUrl = 'http://127.0.0.1:3000/api/prompts';
  
  try {
    console.log('[API] 发送请求到:', apiUrl);
    console.log('[API] 请求数据:', data);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('[API] 服务器响应:', result);
    return result;
  } catch (error) {
    console.error('[API] 请求失败:', error);
    throw error; // 重新抛出错误，让调用者处理
  }
}
