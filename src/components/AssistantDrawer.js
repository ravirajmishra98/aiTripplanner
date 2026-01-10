import React from 'react';

function AssistantDrawer({
  isDesktop,
  isOpen,
  onClose,
  messages,
  messagesContainerRef,
  input,
  setInput,
  onSend,
  onKeyDown,
  loading,
  hasPlan
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (mobile only) */}
      {!isDesktop && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Drawer Container */}
      <div
        style={{
          position: 'fixed',
          [isDesktop ? 'right' : 'bottom']: 0,
          [isDesktop ? 'top' : 'left']: 0,
          width: isDesktop ? '380px' : '100%',
          height: isDesktop ? '100%' : '70vh',
          background: 'var(--surface)',
          borderLeft: isDesktop ? '1px solid var(--border)' : 'none',
          borderTop: !isDesktop ? '1px solid var(--border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: isDesktop
            ? '-4px 0 16px rgba(0,0,0,0.08)'
            : '0 -4px 16px rgba(0,0,0,0.08)',
          animation: isDesktop
            ? 'slideInRight 0.3s ease-out'
            : 'slideInUp 0.3s ease-out'
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div
            style={{
              color: '#0f172a',
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '0.2px'
            }}
          >
            💬 Assistant
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(25, 118, 210, 0.08)',
              border: '1px solid rgba(25, 118, 210, 0.2)',
              color: '#0f172a',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(25, 118, 210, 0.15)';
              e.target.style.borderColor = 'rgba(25, 118, 210, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(25, 118, 210, 0.08)';
              e.target.style.borderColor = 'rgba(25, 118, 210, 0.2)';
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minHeight: 0
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  background: isUser ? '#1976d2' : 'rgba(25, 118, 210, 0.1)',
                  color: isUser ? '#fff' : '#0f172a',
                  borderRadius: isUser
                    ? '18px 18px 6px 18px'
                    : '18px 18px 18px 6px',
                  padding: '10px 14px',
                  maxWidth: '85%',
                  whiteSpace: 'pre-line',
                  fontSize: 14,
                  lineHeight: 1.4,
                  boxShadow: isUser ? '0 2px 8px rgba(25, 118, 210, 0.2)' : 'none'
                }}
              >
                {msg.text}
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '12px 18px 16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#64748b',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {hasPlan ? 'Refine your plan' : 'Create a plan first'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="text"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={hasPlan ? "Ask to explain or refine..." : "Go to Home to create a plan"}
              style={{
                flex: 1,
                fontSize: 13,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: '#0f172a',
                outline: 'none',
                transition: 'border 0.2s'
              }}
            />
            <button
              onClick={onSend}
              disabled={loading || !input.trim()}
              style={{
                background:
                  loading || !input.trim()
                    ? 'rgba(25, 118, 210, 0.3)'
                    : '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 14px',
                fontWeight: 600,
                fontSize: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
                transition: 'background 0.2s'
              }}
            >
              {loading ? '⏳' : '→'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AssistantDrawer;
