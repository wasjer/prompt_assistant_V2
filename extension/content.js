/**
 * AI Prompt 捕获脚本（Router 模式 · 严格平台隔离）
 * 职责：根据 window.location.hostname 仅执行当前平台的逻辑，互不干扰
 * 支持平台：ChatGPT, 通义千问, 豆包, Google Gemini, DeepSeek
 */

(function() {
  'use strict';

  const hostname = window.location.hostname;

  // ---------- Router：严格按 hostname 分流，只执行一个分支 ----------
  const CHATGPT_DOMAINS = /chatgpt\.com|chat\.openai\.com/;
  const QWEN_DOMAINS = /qianwen\.com|tongyi\.aliyun\.com/;
  const DOUBAO_DOMAINS = /doubao\.com/;
  const GEMINI_DOMAINS = /gemini\.google\.com/;
  const DEEPSEEK_DOMAINS = /deepseek\.com/;

  if (CHATGPT_DOMAINS.test(hostname)) {
    runPlatformCapture(getChatGPTConfig());
    return;
  }
  if (QWEN_DOMAINS.test(hostname)) {
    runPlatformCapture(getQwenConfig());
    return;
  }
  if (DOUBAO_DOMAINS.test(hostname)) {
    runPlatformCapture(getDoubaoConfig());
    return;
  }
  if (GEMINI_DOMAINS.test(hostname)) {
    runPlatformCapture(getGeminiConfig());
    return;
  }
  if (DEEPSEEK_DOMAINS.test(hostname)) {
    runPlatformCapture(getDeepseekConfig());
    return;
  }
  // 非支持平台，不注册任何监听、不执行任何逻辑
  return;

  function getChatGPTConfig() {
    return {
      platform: 'chatgpt',
      model: 'chatgpt',
      // ChatGPT 输入框：首选 #prompt-textarea（可能是 contenteditable 自身或其容器），再 contenteditable 备选
      inputSelectors: [
        '#prompt-textarea[contenteditable="true"]',
        '#prompt-textarea',
        '[data-id="root"] [contenteditable="true"]',
        'form [contenteditable="true"]',
        '[contenteditable="true"][data-placeholder]',
        'textarea[id*="prompt"]',
        'textarea[placeholder*="Message"]'
      ],
      sendButtonSelectors: [
        '[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'button:has(svg[data-icon="paper-plane"])'
      ]
    };
  }

  function getQwenConfig() {
    return {
      platform: 'qwen',
      model: 'qwen',
      inputSelectors: [
        'textarea[rows]',
        'textarea:not([disabled]):not([readonly])',
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="消息"]',
        'textarea[placeholder*="说点什么"]',
        'textarea[placeholder*="请输入"]',
        'textarea[class*="input"]',
        'textarea[class*="textarea"]',
        '.input-area textarea',
        '.input-box textarea',
        'textarea'
      ],
      sendButtonSelectors: [
        '[aria-label*="发送"]',
        '[aria-label*="Send" i]',
        '[title*="发送"]',
        '[title*="Send" i]',
        '[class*="send-btn" i]',
        '[class*="send-button" i]',
        '[class*="submit-btn" i]',
        '[class*="submit-button" i]',
        '[class*="send" i][class*="btn" i]',
        '[role="button"][aria-label*="发送"]',
        '[role="button"][aria-label*="Send" i]',
        '[role="button"][class*="send" i]',
        '[data-id*="send" i]',
        '[data-testid*="send" i]',
        'div[class*="send" i]',
        'span[class*="send" i]',
        'button[aria-label*="发送"]',
        'button[aria-label*="Send" i]',
        'button[type="submit"]',
        'button[class*="send" i]',
        '.send-button',
        '.submit-button'
      ]
    };
  }

  function getDoubaoConfig() {
    return {
      platform: 'doubao',
      model: 'doubao',
      inputSelectors: [
        'textarea[data-testid="chat_input_input"]',
        'textarea.semi-input-textarea',
        'textarea[rows]',
        'textarea:not([disabled]):not([readonly])',
        'textarea[placeholder*="输入"]',
        'textarea[placeholder*="消息"]',
        'textarea[placeholder*="说点什么"]',
        'textarea[placeholder*="请输入"]',
        'textarea[class*="input"]',
        'textarea[class*="textarea"]',
        '.input-area textarea',
        '.input-box textarea',
        'textarea'
      ],
      sendButtonSelectors: [
        '[aria-label*="发送"]',
        '[aria-label*="Send" i]',
        '[title*="发送"]',
        '[title*="Send" i]',
        '[class*="send-btn" i]',
        '[class*="send-button" i]',
        '[class*="submit-btn" i]',
        'button[aria-label*="发送"]',
        'button[aria-label*="Send" i]',
        'button[type="submit"]',
        '.send-button',
        '.submit-button'
      ]
    };
  }

  function getGeminiConfig() {
    return {
      platform: 'gemini',
      model: 'gemini',
      inputSelectors: [
        'textarea[placeholder*="Enter a prompt"]',
        'textarea[placeholder*="Message"]',
        'textarea[aria-label*="prompt"]',
        '[contenteditable="true"][data-placeholder]',
        'form textarea',
        'textarea:not([disabled]):not([readonly])',
        '[contenteditable="true"]',
        'textarea'
      ],
      sendButtonSelectors: [
        '[aria-label*="Send"]',
        '[data-tooltip*="Send"]',
        'button[aria-label*="Send"]',
        'button[type="submit"]',
        '[role="button"][aria-label*="Send"]'
      ]
    };
  }

  function getDeepseekConfig() {
    return {
      platform: 'deepseek',
      model: 'deepseek',
      inputSelectors: [
        'textarea[id*="chat"]',
        'textarea[placeholder*="DeepSeek" i]',
        'textarea[placeholder*="发送" i]',
        'textarea[placeholder*="Message" i]',
        'textarea'
      ],
      sendButtonSelectors: [
        'div[role="button"]:has(svg)',
        'button:has(svg)',
        'div[aria-label*="发送" i]',
        'div[aria-label*="Send" i]'
      ]
    };
  }

  /**
   * 单平台捕获管道：所有状态（缓存、Observer、定时器）均在此闭包内，与其它平台完全隔离
   */
  function runPlatformCapture(config) {
    let currentPromptCache = '';
    let inputMutationObserver = null;
    let currentInputElement = null;
    let isListenerAttached = false;
    let pollingTimer = null;
    const platformName = config.platform;

    function updateCache(inputElement) {
      if (!inputElement) return;
      let text = '';
      if (inputElement.tagName === 'TEXTAREA') {
        text = inputElement.value?.trim() || '';
      } else if (inputElement.contentEditable === 'true' || inputElement.hasAttribute('contenteditable')) {
        text = inputElement.innerText?.trim() || inputElement.textContent?.trim() || '';
      } else {
        text = inputElement.value?.trim() || '';
      }
      // 防止点击发送时：焦点移到按钮后页面先清空输入框，MutationObserver 把缓存覆盖为空导致点击发送读到空
      if (text.length === 0 && currentPromptCache.length > 0) return;
      currentPromptCache = text;
    }

    function handleInput(event) {
      updateCache(event.target);
    }

    /**
     * 全局 input 事件代理（捕获阶段）：任意 textarea/contenteditable 触发 input 时同步缓存并对齐 currentInputElement
     * 用于应对节点被替换、iframe、或未通过 findInputElement 绑定的情况
     */
    function handleGlobalInput(event) {
      var target = event.target;
      if (!target || target.nodeType !== 1) return;
      var isInputLike = target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.hasAttribute('contenteditable');
      if (!isInputLike) return;
      updateCache(target);
      currentInputElement = target;
    }

    /** ChatGPT：从 #prompt-textarea 节点解析出实际可绑定的 contenteditable（自身或子节点） */
    function resolveChatGPTPromptEditable(container) {
      if (!container) return null;
      if (container.contentEditable === 'true' || container.getAttribute('contenteditable') === 'true') {
        return container;
      }
      const inner = container.querySelector && container.querySelector('[contenteditable="true"]');
      return inner || null;
    }

    function findInputElement() {
      for (const selector of config.inputSelectors) {
        try {
          const element = document.querySelector(selector);
          if (!element) continue;

          if (config.platform === 'chatgpt' && (element.id === 'prompt-textarea' || selector === '#prompt-textarea')) {
            var resolvedEditable = resolveChatGPTPromptEditable(element);
            if (resolvedEditable) {
              return resolvedEditable;
            }
            continue;
          }

          if (element.tagName === 'TEXTAREA' ||
              element.contentEditable === 'true' ||
              element.hasAttribute('contenteditable')) {
            if ((config.platform === 'qwen' || config.platform === 'doubao') && element.tagName === 'TEXTAREA') {
              const style = window.getComputedStyle(element);
              if (style.display === 'none' || style.visibility === 'hidden' || element.disabled) continue;
            }
            return element;
          }
        } catch (e) {
          continue;
        }
      }

      if (config.platform === 'qwen') {
        const allTextareas = Array.from(document.querySelectorAll('textarea'))
          .filter(textarea => {
            const style = window.getComputedStyle(textarea);
            return style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              !textarea.disabled &&
              !textarea.readOnly &&
              textarea.offsetWidth > 0 &&
              textarea.offsetHeight > 0;
          });
        if (allTextareas.length > 0) {
          const largest = allTextareas.reduce((a, b) =>
            (b.offsetWidth * b.offsetHeight > a.offsetWidth * a.offsetHeight ? b : a));
          return largest;
        }
      }

      if (config.platform === 'doubao') {
        const allTextareas = Array.from(document.querySelectorAll('textarea'))
          .filter(textarea => {
            const style = window.getComputedStyle(textarea);
            return style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              !textarea.disabled &&
              !textarea.readOnly &&
              textarea.offsetWidth > 0 &&
              textarea.offsetHeight > 0;
          });
        if (allTextareas.length > 0) {
          const largest = allTextareas.reduce((a, b) =>
            (b.offsetWidth * b.offsetHeight > a.offsetWidth * a.offsetHeight ? b : a));
          return largest;
        }
      }

      if (config.platform === 'chatgpt') {
        var promptRootEl = document.getElementById('prompt-textarea');
        var chatgptEditable = resolveChatGPTPromptEditable(promptRootEl);
        if (chatgptEditable) return chatgptEditable;
        var editableList = document.querySelectorAll('[contenteditable="true"]');
        if (editableList.length > 0) return editableList[editableList.length - 1];
        return null;
      }

      const contentEditables = document.querySelectorAll('[contenteditable="true"]');
      if (contentEditables.length > 0) return contentEditables[contentEditables.length - 1];
      return null;
    }

    function attachInputListener(inputElement) {
      if (!inputElement) return;
      if (currentInputElement === inputElement && isListenerAttached) return;

      if (inputMutationObserver) {
        inputMutationObserver.disconnect();
        inputMutationObserver = null;
      }

      if (inputElement.tagName === 'TEXTAREA') {
        inputElement.removeEventListener('input', handleInput);
        inputElement.removeEventListener('keyup', handleInput);
        inputElement.removeEventListener('keydown', handleInput);
        inputElement.addEventListener('input', handleInput, true);
        inputElement.addEventListener('keyup', handleInput, true);
        if (config.platform === 'doubao') {
          inputElement.addEventListener('keydown', handleInput, true);
        }
        updateCache(inputElement);
      } else if (inputElement.contentEditable === 'true' || inputElement.hasAttribute('contenteditable')) {
        inputMutationObserver = new MutationObserver(() => updateCache(inputElement));
        inputMutationObserver.observe(inputElement, {
          childList: true,
          subtree: true,
          characterData: true
        });
        updateCache(inputElement);
      }

      currentInputElement = inputElement;
      isListenerAttached = true;
      stopPolling();
    }

    function startPolling() {
      if (pollingTimer) return;
      pollingTimer = setInterval(() => {
        if (isListenerAttached && currentInputElement) {
          stopPolling();
          return;
        }
        const inputElement = findInputElement();
        if (inputElement) attachInputListener(inputElement);
      }, 500);
      setTimeout(() => {
        if (pollingTimer) stopPolling();
      }, 30000);
    }

    function stopPolling() {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    }

    function findSendButton(target) {
      // 1. 确保 target 是合法的元素节点 (防止点击到文本节点报错)
      if (!target || target.nodeType !== 1) {
        target = target && target.parentNode;
      }
      if (!target || typeof target.closest !== 'function') return null;
      // 2. 遍历配置里的发送按钮选择器，使用 closest 精确匹配
      for (const selector of config.sendButtonSelectors) {
        try {
          const button = target.closest(selector);
          if (button) return button;
        } catch (e) {
          continue;
        }
      }
      // 3. 千问/豆包兜底：点击在 button 或 [role="button"] 上且文案含 发送/Send 则视为发送按钮
      if (config.platform === 'qwen' || config.platform === 'doubao') {
        try {
          var btn = target.closest('button') || target.closest('[role="button"]');
          if (btn) {
            var label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent || '').toLowerCase();
            if (label.indexOf('发送') !== -1 || label.indexOf('send') !== -1) return btn;
          }
        } catch (e) { /* ignore */ }
      }
      return null;
    }

    function handleKeyDown(event) {
      const target = event.target;
      if (!target) return;
      const isTextInput = target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.hasAttribute('contenteditable');
      // 放宽校验：只要当前焦点是输入型元素且按回车（排除 shift/输入法），即触发；不依赖 currentInputElement，避免节点被替换后校验失败
      if (isTextInput && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        updateCache(target);
        currentInputElement = target;
        extractAndSendPrompt();
      }
    }

    function handleClick(event) {
      const sendButton = findSendButton(event.target);
      if (sendButton) extractAndSendPrompt();
    }

    function extractAndSendPrompt() {
      const promptText = currentPromptCache.trim();
      if (!promptText) return;
      const dataObject = {
        id: crypto.randomUUID(),
        prompt: promptText,
        model: config.model,
        url: window.location.href,
        ts: Date.now()
      };
      chrome.runtime.sendMessage({ type: 'SAVE_PROMPT', data: dataObject }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Prompt Capture] 发送消息失败:', chrome.runtime.lastError.message);
          return;
        }
        if (!(response && response.success)) {
          console.error('[Prompt Capture] 保存失败:', response && response.error ? response.error : '未知错误');
        }
      });
      currentPromptCache = '';
    }

    function init() {
      const inputElement = findInputElement();
      if (inputElement) {
        attachInputListener(inputElement);
      } else {
        startPolling();
        const globalObserver = new MutationObserver(() => {
          if (!isListenerAttached) {
            const el = findInputElement();
            if (el) {
              attachInputListener(el);
              globalObserver.disconnect();
            }
          }
        });
        globalObserver.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => globalObserver.disconnect(), 30000);
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('input', handleGlobalInput, true);
    document.addEventListener('click', handleClick, true);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
