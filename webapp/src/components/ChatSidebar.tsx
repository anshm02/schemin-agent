import React from 'react';
import { ChatMessage } from '../utils/gptParser';

interface ChatSidebarProps {
  chatWidth: number;
  chatInput: string;
  chatMessages: ChatMessage[];
  isProcessing: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  onChatInputChange: (value: string) => void;
  onChatSubmit: () => void;
  onClose: () => void;
  onStartResize: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatWidth,
  chatInput,
  chatMessages,
  isProcessing,
  chatEndRef,
  onChatInputChange,
  onChatSubmit,
  onClose,
  onStartResize
}) => {
  return (
    <div style={{
      width: `${chatWidth}px`,
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Resize Handle */}
      <div
        onMouseDown={onStartResize}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: 'transparent',
          zIndex: 10
        }}
      />

      {/* Chat Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827'
          }}>
            Create Automation
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>
        <p style={{
          margin: '4px 0 0 0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Describe what you want to automate
        </p>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {chatMessages.length === 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Tell me what you'd like to automate. I'll help you set it up!
          </div>
        )}
        
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? '#5B5FED' : '#f3f4f6',
              color: msg.role === 'user' ? '#ffffff' : '#111827',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '1.5',
              wordBreak: 'break-word'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#f3f4f6',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Thinking...
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onChatSubmit();
              }
            }}
            placeholder="Type your message..."
            disabled={isProcessing}
            rows={3}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#111827',
              resize: 'none'
            }}
          />
          <button
            onClick={onChatSubmit}
            disabled={isProcessing || !chatInput.trim()}
            style={{
              padding: '12px 16px',
              backgroundColor: isProcessing || !chatInput.trim() ? '#d1d5db' : '#5B5FED',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: isProcessing || !chatInput.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              height: '73px',
              minWidth: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

