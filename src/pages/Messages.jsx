import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../App';
import { Mail, MailOpen } from 'lucide-react';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// 내가 받은 메시지함. 숙소 상세 페이지의 "호스트에게 메시지"/"위위 관리자에게 문의하기" 버튼을 통해
// 도착한 메시지가 여기 표시됩니다(수신자 본인만 조회 가능하도록 RLS가 강제).
function Messages({ userProfile }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, message, read, created_at, sender:users!messages_sender_id_fkey(full_name, church_name), accommodations(title)')
        .eq('recipient_id', userProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markRead = async (message) => {
    if (message.read) return;
    try {
      const { error } = await supabase.from('messages').update({ read: true }).eq('id', message.id);
      if (error) throw error;
      setMessages(messages.map(m => (m.id === message.id ? { ...m, read: true } : m)));
    } catch (error) {
      console.error('읽음 처리 오류:', error);
    }
  };

  return (
    <div className="messages-page">
      <div className="container">
        <h1>메시지함</h1>
        <p className="subtitle">받은 메시지를 확인하세요. 답장은 발송된 이메일로 직접 회신해주시면 됩니다.</p>

        {loading ? (
          <p>로드 중...</p>
        ) : messages.length === 0 ? (
          <p className="empty-message">받은 메시지가 없습니다.</p>
        ) : (
          <div className="message-list">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`card message-card ${msg.read ? '' : 'unread'}`}
                onClick={() => markRead(msg)}
              >
                <div className="message-card-header">
                  <div className="message-sender">
                    {msg.read ? <MailOpen size={18} /> : <Mail size={18} />}
                    <span className="sender-name">{msg.sender?.full_name || '알 수 없음'}</span>
                    {msg.sender?.church_name && <span className="sender-church">· {msg.sender.church_name}</span>}
                  </div>
                  {!msg.read && <span className="badge badge-warning">읽지 않음</span>}
                </div>
                {msg.accommodations?.title && (
                  <p className="message-context">숙소: {msg.accommodations.title}</p>
                )}
                <p className="message-body">{msg.message}</p>
                <p className="message-date">{formatDate(msg.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .messages-page {
          flex: 1;
        }

        .subtitle {
          color: #7f8c8d;
          margin-top: -1rem;
          margin-bottom: 2rem;
        }

        .empty-message {
          text-align: center;
          color: #95a5a6;
          padding: 2rem;
        }

        .message-list {
          display: grid;
          gap: 1rem;
        }

        .message-card {
          cursor: pointer;
          transition: box-shadow 0.2s;
        }

        .message-card.unread {
          border-left: 4px solid #d97b3f;
          background: #fdf8f1;
        }

        .message-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }

        .message-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .message-sender {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #2c3e50;
        }

        .message-sender svg {
          color: #d97b3f;
          flex-shrink: 0;
        }

        .sender-name {
          font-weight: 700;
        }

        .sender-church {
          color: #7f8c8d;
          font-size: 0.9rem;
          font-weight: 400;
        }

        .message-context {
          color: #7f8c8d;
          font-size: 0.85rem;
          margin: 0 0 0.5rem;
        }

        .message-body {
          color: #444;
          line-height: 1.6;
          white-space: pre-wrap;
          margin: 0 0 0.5rem;
        }

        .message-date {
          color: #b2bec3;
          font-size: 0.78rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default Messages;
