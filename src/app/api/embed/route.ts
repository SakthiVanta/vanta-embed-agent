import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant/resolver'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json(
      { error: 'Agent ID required' },
      { status: 400 }
    )
  }

  const origin = request.headers.get('origin')
  const tenant = await resolveTenant(agentId, origin || undefined)

  if (!tenant.isValid) {
    return NextResponse.json(
      { error: tenant.error || 'Invalid agent' },
      { status: 403 }
    )
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      tools: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          requiresConfirmation: true,
        },
      },
    },
  })

  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    )
  }

  const embedScript = generateEmbedScript(agent)

  return new Response(embedScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function generateEmbedScript(agent: any): string {
  const config = {
    agentId: agent.id,
    name: agent.name,
    uiMode: agent.uiMode,
    floatingPosition: agent.floatingPosition,
    theme: agent.theme,
    tools: agent.tools.map((t: any) => ({
      name: t.name,
      description: t.description,
      requiresConfirmation: t.requiresConfirmation,
    })),
  }

  return `
(function() {
  'use strict';
  
  const config = ${JSON.stringify(config)};
  const API_BASE = '${process.env.NEXT_PUBLIC_APP_URL || ''}/api';
  
  class VantaAgent {
    constructor() {
      this.container = null;
      this.isOpen = false;
      this.sessionId = null;
      this.messages = [];
      this.init();
    }
    
    init() {
      this.createStyles();
      if (config.uiMode === 'FLOATING') {
        this.createFloatingWidget();
      } else {
        this.createEmbeddedWidget();
      }
    }
    
    createStyles() {
      const styles = document.createElement('style');
      styles.textContent = \`
        .vanta-agent-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --vanta-primary: \${config.theme?.primaryColor || '#10b981'};
          --vanta-bg: \${config.theme?.backgroundColor || '#ffffff'};
          --vanta-text: \${config.theme?.textColor || '#1f2937'};
        }
        .vanta-agent-floating {
          position: fixed;
          z-index: 9999;
          \${getPositionStyles(config.floatingPosition)}
        }
        .vanta-agent-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--vanta-primary);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .vanta-agent-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        .vanta-agent-chat {
          position: absolute;
          bottom: 72px;
          right: 0;
          width: 380px;
          height: 600px;
          max-height: calc(100vh - 100px);
          background: var(--vanta-bg);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          transform: scale(0.95) translateY(10px);
          pointer-events: none;
          transition: opacity 0.3s, transform 0.3s;
        }
        .vanta-agent-chat.open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }
        .vanta-agent-header {
          padding: 16px;
          background: var(--vanta-primary);
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vanta-agent-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vanta-agent-message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
        }
        .vanta-agent-message.user {
          align-self: flex-end;
          background: var(--vanta-primary);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .vanta-agent-message.assistant {
          align-self: flex-start;
          background: #f3f4f6;
          color: var(--vanta-text);
          border-bottom-left-radius: 4px;
        }
        .vanta-agent-input-container {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }
        .vanta-agent-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
        }
        .vanta-agent-input:focus {
          border-color: var(--vanta-primary);
        }
        .vanta-agent-send {
          padding: 12px 20px;
          background: var(--vanta-primary);
          color: white;
          border: none;
          border-radius: 24px;
          cursor: pointer;
          font-weight: 500;
        }
        .vanta-agent-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .vanta-agent-typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }
        .vanta-agent-typing span {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: vanta-bounce 1.4s infinite ease-in-out both;
        }
        .vanta-agent-typing span:nth-child(1) { animation-delay: -0.32s; }
        .vanta-agent-typing span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes vanta-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .vanta-agent-embedded {
          width: 100%;
          height: 100%;
          min-height: 400px;
        }
        .vanta-agent-tool-confirm {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 12px;
          padding: 16px;
          margin: 8px 0;
        }
        .vanta-agent-tool-confirm p {
          margin: 0 0 12px 0;
          font-size: 14px;
        }
        .vanta-agent-tool-buttons {
          display: flex;
          gap: 8px;
        }
        .vanta-agent-tool-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        .vanta-agent-tool-btn.confirm {
          background: var(--vanta-primary);
          color: white;
        }
        .vanta-agent-tool-btn.cancel {
          background: #e5e7eb;
          color: #374151;
        }
      \`;
      document.head.appendChild(styles);
    }
    
    createFloatingWidget() {
      this.container = document.createElement('div');
      this.container.className = 'vanta-agent-container vanta-agent-floating';
      
      const button = document.createElement('button');
      button.className = 'vanta-agent-button';
      button.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      button.onclick = () => this.toggleChat();
      
      const chat = document.createElement('div');
      chat.className = 'vanta-agent-chat';
      chat.innerHTML = this.getChatHTML();
      
      this.container.appendChild(chat);
      this.container.appendChild(button);
      document.body.appendChild(this.container);
      
      this.attachEventListeners(chat);
    }
    
    createEmbeddedWidget() {
      const target = document.getElementById('vanta-agent') || document.currentScript?.parentElement;
      if (!target) return;
      
      this.container = document.createElement('div');
      this.container.className = 'vanta-agent-container vanta-agent-embedded';
      this.container.innerHTML = this.getChatHTML();
      target.appendChild(this.container);
      this.isOpen = true;
      
      this.attachEventListeners(this.container);
    }
    
    getChatHTML() {
      return \`
        <div class="vanta-agent-header">
          <span>\${config.name}</span>
          <button onclick="this.closest('.vanta-agent-chat').classList.remove('open')" style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="vanta-agent-messages"></div>
        <div class="vanta-agent-input-container">
          <input type="text" class="vanta-agent-input" placeholder="Type a message..." />
          <button class="vanta-agent-send">Send</button>
        </div>
      \`;
    }
    
    attachEventListeners(container) {
      const input = container.querySelector('.vanta-agent-input');
      const sendBtn = container.querySelector('.vanta-agent-send');
      const messagesContainer = container.querySelector('.vanta-agent-messages');
      
      const sendMessage = async () => {
        const message = input.value.trim();
        if (!message) return;
        
        input.value = '';
        this.addMessage('user', message);
        this.showTyping();
        
        try {
          await this.sendToAPI(message);
        } catch (error) {
          this.hideTyping();
          this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
      };
      
      sendBtn.onclick = sendMessage;
      input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
      };
    }
    
    toggleChat() {
      const chat = this.container.querySelector('.vanta-agent-chat');
      this.isOpen = !this.isOpen;
      chat.classList.toggle('open', this.isOpen);
      if (this.isOpen && this.messages.length === 0) {
        this.addMessage('assistant', 'Hello! How can I help you today?');
      }
    }
    
    addMessage(role, content) {
      this.messages.push({ role, content });
      const messagesContainer = this.container.querySelector('.vanta-agent-messages');
      const msgDiv = document.createElement('div');
      msgDiv.className = \`vanta-agent-message \${role}\`;
      msgDiv.textContent = content;
      messagesContainer.appendChild(msgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    showTyping() {
      const messagesContainer = this.container.querySelector('.vanta-agent-messages');
      const typing = document.createElement('div');
      typing.className = 'vanta-agent-message assistant vanta-agent-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      typing.id = 'vanta-typing';
      messagesContainer.appendChild(typing);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTyping() {
      const typing = document.getElementById('vanta-typing');
      if (typing) typing.remove();
    }
    
    async sendToAPI(message) {
      const response = await fetch(\`\${API_BASE}/chat\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: config.agentId,
          sessionId: this.sessionId,
          message,
        }),
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullMessage = '';
      
      this.hideTyping();
      const msgDiv = document.createElement('div');
      msgDiv.className = 'vanta-agent-message assistant';
      this.container.querySelector('.vanta-agent-messages').appendChild(msgDiv);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const chunk = JSON.parse(data);
              if (chunk.type === 'content' && chunk.content) {
                fullMessage += chunk.content;
                msgDiv.textContent = fullMessage;
              }
              if (chunk.type === 'tool_call') {
                this.showToolConfirmation(chunk.tool_call);
              }
            } catch (e) {}
          }
        }
      }
      
      this.messages.push({ role: 'assistant', content: fullMessage });
    }
    
    showToolConfirmation(toolCall) {
      const tool = config.tools.find(t => t.name === toolCall.function.name);
      if (!tool || !tool.requiresConfirmation) return;
      
      const messagesContainer = this.container.querySelector('.vanta-agent-messages');
      const confirmDiv = document.createElement('div');
      confirmDiv.className = 'vanta-agent-tool-confirm';
      confirmDiv.innerHTML = \`
        <p>The agent wants to execute: <strong>\${tool.name}</strong></p>
        <div class="vanta-agent-tool-buttons">
          <button class="vanta-agent-tool-btn confirm">Confirm</button>
          <button class="vanta-agent-tool-btn cancel">Cancel</button>
        </div>
      \`;
      messagesContainer.appendChild(confirmDiv);
    }
  }
  
  function getPositionStyles(position) {
    switch(position) {
      case 'top-left': return 'top: 20px; left: 20px;';
      case 'top-right': return 'top: 20px; right: 20px;';
      case 'bottom-left': return 'bottom: 20px; left: 20px;';
      case 'bottom-right':
      default: return 'bottom: 20px; right: 20px;';
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new VantaAgent());
  } else {
    new VantaAgent();
  }
})();
`;
}
