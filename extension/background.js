/**
 * 后台脚本（Service Worker）
 * 职责：监听来自 content script 的消息，并调用 API 发送数据
 * 注意：Service Worker 不受页面 CSP 限制，可以自由发起网络请求
 */

// 内联 API 函数（避免 importScripts 路径问题）
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
    throw error;
  }
}

/**
 * 监听来自 content script 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 当收到 type 为 SAVE_PROMPT 的消息时
  if (message.type === 'SAVE_PROMPT') {
    // 提取出附带的 data 数据
    const promptData = message.data;
    
    console.log('[Background] 收到保存请求:', promptData);
    
    // 调用 api.js 中的发送函数，将提取到的数据发给本地后端
    sendPromptToAPI(promptData)
      .then((result) => {
        // 发送成功响应
        console.log('[Background] 保存成功:', result);
        sendResponse({ 
          success: true, 
          data: result 
        });
      })
      .catch((error) => {
        // 发送失败响应
        console.error('[Background] 保存失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '未知错误'
        });
      });
    
    // 返回 true 表示异步响应
    return true;
  }
  
  // 返回 false 表示同步响应（如果没有匹配的消息类型）
  return false;
});
