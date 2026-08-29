import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../App';
import { Mail, MailOpen, ChevronLeft, ChevronRight, ArrowLeft, Send, Trash2 } from 'lucide-react';
import PageHero from '../components/PageHero';

// 메시지함 페이지 상단 슬라이드 배너 사진
const MESSAGES_HERO_IMAGES = [
  'https://images.pexels.com/photos/6830874/pexels-photo-6830874.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/6830868/pexels-photo-6830868.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/6830379/pexels-photo-6830379.jpeg?auto=compress&cs=tinysrgb&w=1600'
];

const PAGE_SIZE = 20;
const LIST_PREVIEW_LENGTH = 120;

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// 내가 받은 메시지함. 숙소 상세 페이지의 "호스트에게 메시지"/"위위 관리자에게 문의하기" 버튼을 통해
// 도착한 메시지, 그리고 대화 상대가 보낸 답장이 여기 표시됩니다(수신자 본인만 조회 가능하도록 RLS가 강제).
// 목록에서 메시지를 클릭하면 상세(대화) 화면으로 전환되며, 그 안에서 바로 답장을 작성해 보낼 수 있고
// 답장은 이메일로도 함께 발송됩니다. 이미 읽은 메시지는 상세 화면에서 대화 전체를 삭제할 수 있습니다.
function Messages({ userProfile }) {
  const [messages, setMessages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [activeRoot, setActiveRoot] = useState(null);
  const [activeThread, setActiveThread] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');

  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchMessages = useCallback(async (targetPage) => {
    setLoading(true);
    try {
      const from = targetPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('messages')
        .select(
          'id, message, read, created_at, thread_id, sender_id, accommodation_id, sender:users!messages_sender_id_fkey(full_name, church_name), accommodations(title)',
          { count: 'exact' }
        )
        .eq('recipient_id', userProfile.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      setMessages(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('메시지 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile.id]);

  useEffect(() => {
    fetchMessages(page);
  }, [fetchMessages, page]);

  const openDetail = async (msg) => {
    setView('detail');
    setActiveRoot(msg);
    setActiveThread([]);
    setReplyText('');
    setReplyError('');
    setThreadLoading(true);

    // 목록에서 열람하는 순간 읽음 처리 (삭제 가능 여부는 이 상태를 기준으로 합니다)
    if (!msg.read) {
      try {
        await supabase.from('messages').update({ read: true }).eq('id', msg.id);
        setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, read: true } : m)));
        msg = { ...msg, read: true };
        setActiveRoot(msg);
      } catch (error) {
        console.error('읽음 처리 오류:', error);
      }
    }

    const rootId = msg.thread_id || msg.id;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          'id, message, read, created_at, sender_id, recipient_id, thread_id, sender:users!messages_sender_id_fkey(full_name, church_name), accommodations(title)'
        )
        .or(`id.eq.${rootId},thread_id.eq.${rootId}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setActiveThread(data || []);
    } catch (error) {
      console.error('대화 내용 로드 오류:', error);
    } finally {
      setThreadLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setActiveRoot(null);
    setActiveThread([]);
    setReplyText('');
    setReplyError('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeRoot) return;

    setReplySending(true);
    setReplyError('');
    try {
      const rootId = activeRoot.thread_id || activeRoot.id;
      // 상세 화면은 항상 "받은 메시지"에서 열리므로, 원 발신자가 곧 답장을 받을 상대방입니다.
      const otherPartyId = activeRoot.sender_id;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userProfile.id,
          recipient_id: otherPartyId,
          accommodation_id: activeRoot.accommodation_id || null,
          message: replyText.trim(),
          thread_id: rootId
        })
        .select('id, message, read, created_at, sender_id, recipient_id, thread_id, accommodations(title)')
        .single();
      if (error) throw error;

      setActiveThread(prev => [...prev, data]);
      setReplyText('');

      // 이메일 발송은 best-effort — 실패해도 답장 자체는 성공한 것으로 처리
      supabase.functions
        .invoke('send-email', { body: { type: 'message_reply', messageId: data.id } })
        .catch((emailErr) => console.error('답장 이메일 발송 오류:', emailErr));
    } catch (error) {
      setReplyError('답장을 보내지 못했습니다: ' + error.message);
    } finally {
      setReplySending(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!activeRoot || !activeRoot.read) return;
    if (!window.confirm('이 대화를 삭제하시겠습니까? 내 메시지함에서만 삭제되며, 되돌릴 수 없습니다.')) return;

    setDeleting(true);
    try {
      const rootId = activeRoot.thread_id || activeRoot.id;
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('recipient_id', userProfile.id)
        .or(`id.eq.${rootId},thread_id.eq.${rootId}`);
      if (error) throw error;

      backToList();
      fetchMessages(page);
    } catch (error) {
      console.error('메시지 삭제 오류:', error);
      alert('삭제하지 못했습니다: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const goToPage = (nextPage) => {
    if (nextPage < 0 || nextPage >= totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className="messages-page">
      <PageHero
        images={MESSAGES_HERO_IMAGES}
        eyebrow="MESSAGES"
        title="주고받은 이야기들"
        subtitle="받은 메시지를 확인하고, 이 자리에서 바로 답장을 보내보세요."
      />
      <div className="container">
        {view === 'list' ? (
          <>
            <h1>메시지함</h1>
            <p className="subtitle">
              받은 메시지를 클릭하면 대화 내용을 자세히 보고, 그 자리에서 바로 답장을 보낼 수 있어요.
              답장을 보내면 상대방에게 이메일로도 함께 알려드립니다.
            </p>

            {loading ? (
              <p>로드 중...</p>
            ) : messages.length === 0 ? (
              <p className="empty-message">받은 메시지가 없습니다.</p>
            ) : (
              <>
                <div className="message-list">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`card message-card ${msg.read ? '' : 'unread'}`}
                      onClick={() => openDetail(msg)}
                    >
                      <div className="message-card-header">
                        <div className="message-sender">
                          {msg.read ? <MailOpen size={18} /> : <Mail size={18} />}
                          <span className="sender-name">{msg.sender?.full_name || '알 수 없음'}</span>
                          {msg.sender?.church_name && <span className="sender-church">· {msg.sender.church_name}</span>}
                          {msg.thread_id && <span className="badge badge-info reply-badge">답장</span>}
                        </div>
                        {!msg.read && <span className="badge badge-warning">읽지 않음</span>}
                      </div>
                      {msg.accommodations?.title && (
                        <p className="message-context">숙소: {msg.accommodations.title}</p>
                      )}
                      <p className="message-body">
                        {msg.message.length > LIST_PREVIEW_LENGTH
                          ? `${msg.message.slice(0, LIST_PREVIEW_LENGTH)}...`
                          : msg.message}
                      </p>
                      <p className="message-date">{formatDate(msg.created_at)}</p>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="message-pagination">
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 0}
                      aria-label="이전 페이지"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="page-indicator">{page + 1} / {totalPages}</span>
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      aria-label="다음 페이지"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="thread-view">
            <button type="button" className="back-link" onClick={backToList}>
              <ArrowLeft size={18} />
              목록으로
            </button>

            <div className="thread-header">
              <h1>{activeRoot?.sender?.full_name || '대화'}</h1>
              {activeRoot?.accommodations?.title && (
                <p className="thread-context">숙소: {activeRoot.accommodations.title}</p>
              )}
            </div>

            {threadLoading ? (
              <p>로드 중...</p>
            ) : (
              <div className="thread-bubbles">
                {activeThread.map(msg => {
                  const isMine = msg.sender_id === userProfile.id;
                  return (
                    <div key={msg.id} className={`thread-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="thread-bubble">
                        <p className="bubble-text">{msg.message}</p>
                        <p className="bubble-date">{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <form className="reply-form" onSubmit={handleReplySubmit}>
              {replyError && <p className="reply-error">{replyError}</p>}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답장을 입력해주세요..."
                rows="3"
                disabled={replySending}
              />
              <div className="reply-actions">
                <button
                  type="button"
                  className="delete-thread-btn"
                  onClick={handleDeleteThread}
                  disabled={!activeRoot?.read || deleting}
                  title={activeRoot?.read ? '이 대화를 삭제합니다' : '읽은 메시지만 삭제할 수 있습니다'}
                >
                  <Trash2 size={16} />
                  {deleting ? '삭제 중...' : '대화 삭제'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={replySending || !replyText.trim()}>
                  <Send size={16} />
                  {replySending ? '전송 중...' : '답장 보내기'}
                </button>
              </div>
            </form>
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
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .message-sender {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #2c3e50;
          flex-wrap: wrap;
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

        .reply-badge {
          font-size: 0.72rem;
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

        .message-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.75rem;
        }

        .page-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #dfe6e9;
          background: white;
          color: #2c3e50;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background: #fdf8f1;
          border-color: #d97b3f;
          color: #d97b3f;
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-indicator {
          color: #7f8c8d;
          font-size: 0.9rem;
          font-variant-numeric: tabular-nums;
        }

        /* 대화(상세) 화면 */
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          border: none;
          color: #b8622c;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem 0;
          margin-bottom: 1rem;
        }

        .thread-header {
          margin-bottom: 1.5rem;
        }

        .thread-header h1 {
          margin-bottom: 0.25rem;
        }

        .thread-context {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .thread-bubbles {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .thread-bubble-row {
          display: flex;
        }

        .thread-bubble-row.theirs {
          justify-content: flex-start;
        }

        .thread-bubble-row.mine {
          justify-content: flex-end;
        }

        .thread-bubble {
          max-width: 72%;
          padding: 0.85rem 1.1rem;
          border-radius: 14px;
          background: #f5f6f7;
        }

        .thread-bubble-row.mine .thread-bubble {
          background: #fdf1e6;
        }

        .bubble-text {
          margin: 0 0 0.35rem;
          color: #2c3e50;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .bubble-date {
          margin: 0;
          font-size: 0.72rem;
          color: #b2bec3;
        }

        .reply-form {
          border-top: 1px solid #ecf0f1;
          padding-top: 1.25rem;
        }

        .reply-form textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #bdc3c7;
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
        }

        .reply-form textarea:focus {
          outline: none;
          border-color: #d97b3f;
          box-shadow: 0 0 0 3px rgba(217, 123, 63, 0.1);
        }

        .reply-error {
          color: #c0392b;
          font-size: 0.9rem;
          margin: 0 0 0.5rem;
        }

        .reply-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.85rem;
          flex-wrap: wrap;
        }

        .delete-thread-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          border: 1px solid #e74c3c;
          color: #e74c3c;
          padding: 0.7rem 1.2rem;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .delete-thread-btn:hover:not(:disabled) {
          background: #e74c3c;
          color: white;
        }

        .delete-thread-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .subtitle {
            font-size: 0.9rem;
            margin-top: -0.5rem;
            margin-bottom: 1.5rem;
          }

          .message-list {
            gap: 0.85rem;
          }

          .message-card-header {
            flex-wrap: wrap;
            gap: 0.4rem;
            margin-bottom: 0.4rem;
          }

          .message-sender {
            font-size: 0.92rem;
          }

          .sender-church {
            font-size: 0.82rem;
          }

          .message-context {
            font-size: 0.8rem;
          }

          .message-body {
            font-size: 0.92rem;
            line-height: 1.5;
          }

          .message-date {
            font-size: 0.74rem;
          }

          .thread-bubble {
            max-width: 85%;
          }

          .reply-actions {
            flex-direction: column-reverse;
            align-items: stretch;
          }

          .reply-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .message-sender {
            font-size: 0.88rem;
          }

          .message-sender span.sender-name {
            font-size: 0.9rem;
          }

          .message-body {
            font-size: 0.88rem;
          }

          .badge {
            font-size: 0.72rem;
            padding: 0.2rem 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Messages;
