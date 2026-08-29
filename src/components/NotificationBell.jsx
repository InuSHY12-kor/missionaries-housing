import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
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
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // 모바일 아이콘 그리드에서는 알림 버튼이 화면 오른쪽 끝이 아니라 그리드 안 어느 칸에든
  // 놓일 수 있습니다. 드롭다운을 버튼 기준 CSS(right: 0)로만 배치하면 버튼 위치에 따라
  // 화면 밖으로 밀려날 수 있어, 열릴 때마다 버튼의 실제 화면 좌표를 기준으로 뷰포트 안에
  // 들어오는 위치를 직접 계산해서 고정 배치합니다.
  const positionDropdown = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 8;
    const width = Math.min(320, window.innerWidth - margin * 2);
    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    const top = Math.min(rect.bottom + 10, window.innerHeight - margin);
    setDropdownStyle({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    positionDropdown();
    window.addEventListener('resize', positionDropdown);
    return () => window.removeEventListener('resize', positionDropdown);
  }, [open, positionDropdown]);

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
        ref={buttonRef}
        className="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="알림"
      >
        <Bell size={20} />
        <span className="nav-tile-caption">알림</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          className="notification-dropdown"
          style={dropdownStyle ? {
            top: `${dropdownStyle.top}px`,
            left: `${dropdownStyle.left}px`,
            width: `${dropdownStyle.width}px`
          } : undefined}
        >
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

        /* 모바일 아이콘 그리드 전용 작은 캡션 — 데스크톱에서는 기존처럼 아이콘만 보이도록 기본값은 숨김.
           App.css의 @media (max-width: 768px) 안에서 .navbar-nav .nav-tile-caption 규칙(더 높은 명시도)이
           다시 보이도록 재정의합니다. */
        .nav-tile-caption {
          display: none;
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

        /* position: fixed + JS로 계산한 top/left(위 positionDropdown 참고)를 사용해 버튼이
           모바일 아이콘 그리드 안 어디에 있든 드롭다운이 항상 화면(뷰포트) 안에 들어오도록
           합니다. 아래 값은 스크립트가 아직 계산하기 전 첫 프레임에 쓰이는 안전한 기본값입니다.
           내부 목록(.notification-list)이 이미 자체 스크롤(max-height: 360px)을 가지고 있으므로
           바깥 상자는 그대로 overflow: hidden(모서리 둥글게 자르는 용도)만 유지합니다. */
        .notification-dropdown {
          position: fixed;
          top: 64px;
          right: 8px;
          left: auto;
          width: min(320px, calc(100vw - 16px));
          max-width: calc(100vw - 16px);
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
          color: #d97b3f;
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
          background: #fdf8f1;
        }

        .notification-item.unread:hover {
          background: #faf1e6;
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
          background: #d97b3f;
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
