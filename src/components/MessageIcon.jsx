import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { supabase } from '../App';

// 30초마다 폴링해서 읽지 않은 메시지 개수를 갱신 (종 아이콘 알림 폴링과 동일한 방식)
const POLL_INTERVAL_MS = 30000;

function MessageIcon({ userProfile }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userProfile.id)
        .eq('read', false);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('메시지 개수 로드 오류:', error);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  if (!userProfile?.id) return null;

  return (
    <button
      type="button"
      className="message-icon-btn"
      onClick={() => navigate('/messages')}
      aria-label="메시지함"
    >
      <Mail size={20} />
      {unreadCount > 0 && (
        <span className="message-icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}

      <style>{`
        .message-icon-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #2c3e50;
          padding: 0.4rem;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .message-icon-btn:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        .message-icon-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #e74c3c;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 10px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          line-height: 1;
        }
      `}</style>
    </button>
  );
}

export default MessageIcon;
