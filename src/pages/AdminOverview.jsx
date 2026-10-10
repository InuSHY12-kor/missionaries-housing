import React, { useEffect, useState } from 'react';
import { BarChart3, Mail, UserCheck, Home, UserX, MessageSquare, ArrowRight } from 'lucide-react';
import { supabase } from '../App';

// 관리자 페이지 첫 화면 "한눈에 보기" (2026-10-10).
//   1) 지금 처리할 일 — 승인 대기 회원·숙소, 계정 삭제 요청, 문의 (누르면 해당 화면으로)
//   2) 방문 통계 요약 — 오늘·총 방문자와 최근 7일 막대, "자세히 보기"로 전체 통계 화면
//   3) 공지 메일 보내기 — 누르면 받는 대상 선택·편집 화면
// onOpen(tab): AdminDashboard의 탭 전환 함수

function kstToday() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const fmt = (n) => Number(n || 0).toLocaleString();

function AdminOverview({ counts, onOpen }) {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    let alive = true;
    const today = kstToday();
    supabase
      .rpc('admin_site_stats', { p_site: null, p_from: addDays(today, -6), p_to: today })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setStatsError(error.message);
        else setStats(data);
      });
    return () => { alive = false; };
  }, []);

  const todos = [
    { tab: 'users', label: '승인 대기 회원', count: counts.users, icon: UserCheck },
    { tab: 'accommodations', label: '승인 대기 숙소', count: counts.accommodations, icon: Home },
    { tab: 'deletions', label: '계정 삭제 요청', count: counts.deletions, icon: UserX },
    { tab: 'inquiries', label: '문의', count: counts.inquiries, icon: MessageSquare },
  ];
  const daily = stats?.daily || [];
  const maxDaily = Math.max(1, ...daily.map((d) => d.visitors));

  return (
    <div className="ao-wrap">
      <section className="ao-card">
        <h2 className="ao-title">지금 처리할 일</h2>
        <div className="ao-todos">
          {todos.map(({ tab, label, count, icon: Icon }) => (
            <button key={tab} type="button" className={`ao-todo ${count > 0 ? 'has' : ''}`} onClick={() => onOpen(tab)}>
              <Icon size={20} />
              <span className="ao-todo-label">{label}</span>
              <span className="ao-todo-count">{fmt(count)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ao-card ao-stats">
        <div className="ao-card-head">
          <h2 className="ao-title"><BarChart3 size={20} /> 방문 통계</h2>
          <button type="button" className="ao-more" onClick={() => onOpen('stats')}>
            자세히 보기 <ArrowRight size={16} />
          </button>
        </div>
        {statsError && <p className="ao-muted">통계를 불러오지 못했습니다.</p>}
        {!stats && !statsError && <p className="ao-muted">불러오는 중...</p>}
        {stats && (
          <div className="ao-stats-body">
            <div className="ao-stat-nums">
              <div><span>오늘 방문자</span><strong>{fmt(stats.today?.visitors)}</strong></div>
              <div><span>최근 7일</span><strong>{fmt(stats.range?.visitors)}</strong></div>
              <div><span>총 방문자</span><strong>{fmt(stats.total?.visitors)}</strong></div>
            </div>
            <div className="ao-mini-chart" aria-label="최근 7일 방문자">
              {daily.map((d) => (
                <div key={d.day} className="ao-mini-col" title={`${d.day} · ${d.visitors}명`}>
                  <div className="ao-mini-bar" style={{ height: `${(d.visitors / maxDaily) * 100}%` }} />
                  <span>{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="ao-card ao-mail">
        <div>
          <h2 className="ao-title"><Mail size={20} /> 공지 메일</h2>
          <p className="ao-muted">선교사·숙소 제공자·후원자에게 WEWE 안내 메일 모양으로 공지를 보냅니다 (wewe@wewestay.com).</p>
        </div>
        <button type="button" className="btn btn-primary ao-mail-btn" onClick={() => onOpen('mail')}>
          <Mail size={16} /> 공지 메일 보내기
        </button>
      </section>

      <style>{`
        .ao-wrap { margin-top: 1.5rem; display: grid; gap: 1rem; word-break: keep-all; }
        .ao-card { background: #fff; border: 1px solid #e5e2da; border-radius: 14px; padding: 1.3rem 1.4rem; }
        .ao-card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
        .ao-title { display: flex; align-items: center; gap: 0.45rem; margin: 0 0 1rem; font-size: 1.1rem; color: #1c1c1a; }
        .ao-card-head .ao-title { margin-bottom: 0.9rem; }
        .ao-muted { color: #6b665c; margin: 0; font-size: 0.92rem; line-height: 1.6; }
        .ao-todos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; }
        .ao-todo { display: flex; flex-direction: column; align-items: flex-start; gap: 0.35rem; padding: 0.95rem 1rem; border: 1px solid #ece7dd; border-radius: 12px; background: #faf8f4; cursor: pointer; text-align: left; color: #6b665c; }
        .ao-todo:hover { border-color: #d97b3f; }
        .ao-todo.has { background: #fff4ea; border-color: #f0c9a0; color: #a8551f; }
        .ao-todo-label { font-weight: 600; font-size: 0.9rem; color: #3a3a36; }
        .ao-todo-count { font-size: 1.6rem; font-weight: 800; color: inherit; line-height: 1.1; }
        .ao-more { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: 1px solid #ddd6c8; border-radius: 999px; padding: 0.4rem 0.85rem; cursor: pointer; font-weight: 600; color: #3a3a36; white-space: nowrap; }
        .ao-more:hover { border-color: #d97b3f; color: #a8551f; }
        .ao-stats-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 1.25rem; align-items: end; }
        .ao-stat-nums { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
        .ao-stat-nums div { background: #faf8f4; border-radius: 10px; padding: 0.8rem 0.9rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .ao-stat-nums span { color: #6b665c; font-size: 0.82rem; font-weight: 600; }
        .ao-stat-nums strong { font-size: 1.5rem; color: #1c1c1a; }
        .ao-stat-nums div:first-child strong { color: #d97b3f; }
        .ao-mini-chart { display: flex; align-items: flex-end; gap: 6px; height: 110px; }
        .ao-mini-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
        .ao-mini-bar { width: 100%; max-width: 30px; background: #e9a06d; border-radius: 4px 4px 0 0; min-height: 2px; }
        .ao-mini-col span { font-size: 0.7rem; color: #8a857b; margin-top: 4px; }
        .ao-mail { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; background: #fffaf3; }
        .ao-mail .ao-title { margin-bottom: 0.35rem; }
        .ao-mail-btn { display: inline-flex; align-items: center; gap: 0.4rem; }
        @media (max-width: 860px) {
          .ao-todos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ao-stats-body { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default AdminOverview;
