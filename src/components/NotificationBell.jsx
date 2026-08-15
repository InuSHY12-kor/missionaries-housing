import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../App';

// 30초마다 폴링해서 새 알림/읽지 않은 개수를 갱신합니다(실시간 구독 대신 단순 폴링 방식).
const POLL_INTERVAL_MS = 30000;

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}

function NotificationBell({ userProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userProfile.id)
          .eq('read', false)
      ]);
      setNotifications(data || []);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('알림 로드 오류:', error);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 바깥 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    try {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  const handleClickNotification = async (notification) => {
    if (!notification.read) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
        setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
      }
    }
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (!userProfile?.id) return null;

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="알림"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>알림</span>
            {unreadCount > 0 && (
              <button type="button" className="notification-mark-all" onClick={markAllRead}>
                모두 읽음
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">알림이 없습니다.</p>
            ) : (
              notifications.map(n => (
                <button
                  type="button"
                  key={n.id}
                  className={`notification-item ${n.read ? '' : 'unread'}`}
                  onClick={() => handleClickNotification(n)}
                >
                  <div className="notification-item-title">{n.title}</div>
                  {n.body && <div className="notification-item-body">{n.body}</div>}
                  <div className="notification-item-time">{timeAgo(n.created_at)}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .notification-bell {
          position: relative;
          display: inline-flex;
        }

        .notification-bell-btn {
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

        .notification-bell-btn:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        .notification-badge {
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

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          max-width: 90vw;
          background: white;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
        }

        .notification-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid #ecf0f1;
          font-weight: 700;
          color: #2c3e50;
        }

        .notification-mark-all {
          background: none;
          border: none;
          color: #16808E;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .notification-mark-all:hover {
          text-decoration: underline;
        }

        .notification-list {
          max-height: 360px;
          overflow-y: auto;
        }

        .notification-empty {
          padding: 2rem 1rem;
          text-align: center;
          color: #95a5a6;
          font-size: 0.9rem;
        }

        .notification-item {
          display: block;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          border-bottom: 1px solid #f4f6f7;
          padding: 0.85rem 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .notification-item:hover {
          background: #f8f9fa;
        }

        .notification-item.unread {
          background: #f0f9fa;
        }

        .notification-item.unread:hover {
          background: #e6f4f5;
        }

        .notification-item-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.2rem;
        }

        .notification-item.unread .notification-item-title::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16808E;
          margin-right: 0.4rem;
        }

        .notification-item-body {
          font-size: 0.82rem;
          color: #7f8c8d;
          margin-bottom: 0.3rem;
          white-space: pre-wrap;
        }

        .notification-item-time {
          font-size: 0.72rem;
          color: #b2bec3;
        }
      `}</style>
    </div>
  );
}

export default NotificationBell;
