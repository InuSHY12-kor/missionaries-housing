import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../App';

// 관리자 페이지 "통계" 탭 (2026-10-10) — WEWE·WEWE STAY 방문 통계.
// 데이터: admin_site_stats() (승인된 관리자만, 집계 결과만). 수집: src/analytics/PageViewTracker.jsx
//   방문자 = 서로 다른 브라우저 수(같은 사람이 휴대폰·PC로 오면 2명), 페이지뷰 = 열어본 페이지 수,
//   유입 경로 = 각 방문(세션)의 첫 페이지가 어디서 왔는지(검색·SNS·공유 링크의 utm_source).
// 날짜는 모두 한국 시간 기준입니다.

const SITE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'wewe', label: 'WEWE' },
  { value: 'stay', label: 'WEWE STAY' },
];

const PERIODS = [
  { days: 7, label: '최근 7일' },
  { days: 30, label: '최근 30일' },
  { days: 90, label: '최근 90일' },
];

const DEVICE_LABEL = { mobile: '휴대폰', tablet: '태블릿', desktop: 'PC', unknown: '알 수 없음' };

function kstToday() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const fmt = (n) => Number(n || 0).toLocaleString();

function SiteStats({ defaultSite = 'all' }) {
  const today = kstToday();
  const [site, setSite] = useState(defaultSite);
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkPath, setLinkPath] = useState('https://wewestay.com/');
  const [linkSource, setLinkSource] = useState('');
  const [linkCampaign, setLinkCampaign] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('admin_site_stats', {
      p_site: site === 'all' ? null : site,
      p_from: from,
      p_to: to,
    });
    if (rpcError) {
      setError(rpcError.message);
      setStats(null);
    } else {
      setStats(data);
    }
    setLoading(false);
  }, [site, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const setPeriod = (days) => {
    setTo(today);
    setFrom(addDays(today, -(days - 1)));
  };

  const maxDaily = useMemo(
    () => Math.max(1, ...((stats?.daily || []).map((d) => d.visitors))),
    [stats]
  );

  const shareLink = useMemo(() => {
    if (!linkSource.trim()) return '';
    try {
      const url = new URL(linkPath.trim() || 'https://wewestay.com/');
      url.searchParams.set('utm_source', linkSource.trim());
      if (linkCampaign.trim()) url.searchParams.set('utm_campaign', linkCampaign.trim());
      return url.toString();
    } catch (e) {
      return '';
    }
  }, [linkPath, linkSource, linkCampaign]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setCopied(false);
    }
  };

  const activeDays = PERIODS.find((p) => from === addDays(today, -(p.days - 1)) && to === today)?.days;

  return (
    <div className="site-stats">
      <div className="ss-toolbar">
        <div className="ss-seg" role="tablist" aria-label="사이트 선택">
          {SITE_OPTIONS.map((o) => (
            <button key={o.value} type="button" className={site === o.value ? 'active' : ''} onClick={() => setSite(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="ss-seg" aria-label="기간 선택">
          {PERIODS.map((p) => (
            <button key={p.days} type="button" className={activeDays === p.days ? 'active' : ''} onClick={() => setPeriod(p.days)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="ss-range">
          <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label="시작일" />
          <span>~</span>
          <input type="date" value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label="종료일" />
        </div>
      </div>

      {error && <p className="ss-error">통계를 불러오지 못했습니다: {error}</p>}
      {loading && !stats && <p>통계를 불러오는 중...</p>}

      {stats && (
        <>
          <div className="ss-cards">
            <div className="ss-card ss-card-accent">
              <span>오늘 방문자</span>
              <strong>{fmt(stats.today?.visitors)}</strong>
              <em>페이지뷰 {fmt(stats.today?.pageviews)}</em>
            </div>
            <div className="ss-card">
              <span>총 방문자</span>
              <strong>{fmt(stats.total?.visitors)}</strong>
              <em>
                페이지뷰 {fmt(stats.total?.pageviews)}
                {stats.total?.since ? ` · ${new Date(stats.total.since).toLocaleDateString('ko-KR')}부터` : ''}
              </em>
            </div>
            <div className="ss-card">
              <span>기간 방문자</span>
              <strong>{fmt(stats.range?.visitors)}</strong>
              <em>방문 {fmt(stats.range?.sessions)}회 · 페이지뷰 {fmt(stats.range?.pageviews)}</em>
            </div>
            {site === 'all' && (
              <div className="ss-card">
                <span>사이트별 (기간)</span>
                {['wewe', 'stay'].map((key) => {
                  const row = (stats.sites || []).find((x) => x.site === key);
                  return (
                    <em key={key}>
                      {key === 'wewe' ? 'WEWE' : 'WEWE STAY'}: 방문자 {fmt(row?.visitors)} · 페이지뷰 {fmt(row?.pageviews)}
                    </em>
                  );
                })}
              </div>
            )}
          </div>

          <section className="ss-panel">
            <h3>일별 방문자</h3>
            <div className="ss-chart" role="img" aria-label="일별 방문자 막대 그래프">
              {(stats.daily || []).map((d) => (
                <div key={d.day} className="ss-bar-col" title={`${d.day} · 방문자 ${d.visitors} · 페이지뷰 ${d.pageviews}`}>
                  <span className="ss-bar-value">{d.visitors > 0 ? d.visitors : ''}</span>
                  <div className="ss-bar" style={{ height: `${(d.visitors / maxDaily) * 100}%` }} />
                  <span className="ss-bar-label">{d.day.slice(5).replace('-', '/')}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="ss-grid">
            <section className="ss-panel">
              <h3>유입 경로</h3>
              <p className="ss-hint">각 방문의 첫 페이지 기준 (검색·SNS·공유 링크)</p>
              {(stats.sources || []).length === 0 ? <p className="ss-empty">아직 기록이 없습니다.</p> : (
                <table className="ss-table">
                  <thead><tr><th>경로</th><th>방문</th></tr></thead>
                  <tbody>
                    {stats.sources.map((s) => (
                      <tr key={s.source}><td>{s.source}</td><td>{fmt(s.sessions)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="ss-panel">
              <h3>많이 본 페이지</h3>
              {(stats.pages || []).length === 0 ? <p className="ss-empty">아직 기록이 없습니다.</p> : (
                <table className="ss-table">
                  <thead><tr><th>페이지</th><th>조회</th><th>방문자</th></tr></thead>
                  <tbody>
                    {stats.pages.map((p) => (
                      <tr key={`${p.site}${p.path}`}>
                        <td className="ss-path">{p.path}</td>
                        <td>{fmt(p.pageviews)}</td>
                        <td>{fmt(p.visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="ss-panel">
              <h3>기기</h3>
              {(stats.devices || []).length === 0 ? <p className="ss-empty">아직 기록이 없습니다.</p> : (
                <table className="ss-table">
                  <thead><tr><th>기기</th><th>방문자</th></tr></thead>
                  <tbody>
                    {stats.devices.map((d) => (
                      <tr key={d.device}><td>{DEVICE_LABEL[d.device] || d.device}</td><td>{fmt(d.visitors)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="ss-panel">
              <h3>공유 링크(캠페인)별 유입</h3>
              {(stats.campaigns || []).length === 0 ? (
                <p className="ss-empty">아래에서 만든 추적 링크로 들어온 방문이 여기에 표시됩니다.</p>
              ) : (
                <table className="ss-table">
                  <thead><tr><th>출처</th><th>캠페인</th><th>방문</th></tr></thead>
                  <tbody>
                    {stats.campaigns.map((c) => (
                      <tr key={`${c.source}|${c.medium}|${c.campaign}`}>
                        <td>{c.source || '-'}</td><td>{c.campaign || '-'}</td><td>{fmt(c.sessions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}

      <section className="ss-panel ss-linkmaker">
        <h3>추적 링크 만들기</h3>
        <p className="ss-hint">
          인스타그램·카카오톡·소식지 등에 올릴 링크에 출처 이름을 붙이면, 그 링크로 들어온 방문을 "유입 경로"에서 따로 볼 수 있습니다.
        </p>
        <div className="ss-linkmaker-fields">
          <label>
            연결할 페이지 주소
            <input type="url" value={linkPath} onChange={(e) => setLinkPath(e.target.value)} placeholder="https://wewestay.com/stay" />
          </label>
          <label>
            출처 이름 *
            <input type="text" value={linkSource} onChange={(e) => setLinkSource(e.target.value)} placeholder="예: instagram, kakao, newsletter" />
          </label>
          <label>
            캠페인 이름 (선택)
            <input type="text" value={linkCampaign} onChange={(e) => setLinkCampaign(e.target.value)} placeholder="예: 2026-10-소식, 전투복프로젝트" />
          </label>
        </div>
        {shareLink && (
          <div className="ss-linkmaker-result">
            <code>{shareLink}</code>
            <button type="button" className="btn btn-primary" onClick={copyLink}>{copied ? '복사됨' : '복사'}</button>
          </div>
        )}
      </section>

      <p className="ss-hint ss-privacy">
        이름·이메일·IP 같은 개인정보는 수집하지 않으며, 브라우저마다 만든 무작위 번호로만 방문자를 셉니다.
        관리자 화면과 검색 로봇은 세지 않고, 기록은 2년 뒤 자동 삭제됩니다.
      </p>

      <style>{`
        .site-stats { margin-top: 1.5rem; word-break: keep-all; }
        .ss-toolbar { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-bottom: 1.25rem; }
        .ss-seg { display: inline-flex; border: 1px solid #ddd6c8; border-radius: 999px; overflow: hidden; background: #fff; }
        .ss-seg button { border: 0; background: transparent; padding: 0.5rem 0.9rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; color: #3a3a36; }
        .ss-seg button.active { background: #d97b3f; color: #fff; }
        .ss-range { display: inline-flex; align-items: center; gap: 0.4rem; }
        .ss-range input { padding: 0.45rem 0.55rem; border: 1px solid #ddd6c8; border-radius: 8px; font-size: 0.9rem; }
        .ss-error { color: #b3261e; font-weight: 600; }
        .ss-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.9rem; margin-bottom: 1rem; }
        .ss-card { background: #fff; border: 1px solid #e5e2da; border-radius: 12px; padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .ss-card span { color: #6b665c; font-size: 0.88rem; font-weight: 600; }
        .ss-card strong { font-size: 1.9rem; color: #1c1c1a; line-height: 1.2; }
        .ss-card em { font-style: normal; color: #6b665c; font-size: 0.85rem; }
        .ss-card-accent { border: 2px solid #d97b3f; }
        .ss-card-accent strong { color: #d97b3f; }
        .ss-panel { background: #fff; border: 1px solid #e5e2da; border-radius: 12px; padding: 1.1rem 1.2rem; margin-bottom: 1rem; min-width: 0; }
        .ss-panel h3 { margin: 0 0 0.5rem; font-size: 1.02rem; }
        .ss-hint { color: #6b665c; font-size: 0.85rem; margin: 0 0 0.6rem; line-height: 1.6; }
        .ss-empty { color: #8a857b; font-size: 0.9rem; margin: 0.4rem 0 0; }
        .ss-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1rem; }
        .ss-chart { display: flex; align-items: flex-end; gap: 3px; height: 200px; padding-top: 1.2rem; overflow-x: auto; }
        .ss-bar-col { flex: 1 0 14px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-width: 14px; }
        .ss-bar { width: 100%; max-width: 34px; background: #e9a06d; border-radius: 4px 4px 0 0; min-height: 2px; }
        .ss-bar-col:hover .ss-bar { background: #d97b3f; }
        .ss-bar-value { font-size: 0.7rem; color: #6b665c; margin-bottom: 2px; }
        .ss-bar-label { font-size: 0.66rem; color: #8a857b; margin-top: 4px; white-space: nowrap; }
        .ss-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .ss-table th, .ss-table td { text-align: left; padding: 0.45rem 0.4rem; border-bottom: 1px solid #f0ece4; }
        .ss-table th { color: #6b665c; font-weight: 600; font-size: 0.82rem; }
        .ss-table td:not(:first-child), .ss-table th:not(:first-child) { text-align: right; white-space: nowrap; }
        .ss-path { word-break: break-all; }
        .ss-linkmaker-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.7rem; }
        .ss-linkmaker label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.86rem; font-weight: 600; }
        .ss-linkmaker input { padding: 0.55rem 0.65rem; border: 1px solid #ddd6c8; border-radius: 8px; font-size: 0.92rem; font-weight: 400; min-width: 0; }
        .ss-linkmaker-result { display: flex; gap: 0.6rem; align-items: center; margin-top: 0.8rem; flex-wrap: wrap; }
        .ss-linkmaker-result code { flex: 1; min-width: 0; background: #faf6ef; padding: 0.6rem 0.75rem; border-radius: 8px; word-break: break-all; font-size: 0.85rem; }
        .ss-privacy { margin-top: 0.5rem; }
        @media (max-width: 760px) {
          .ss-grid, .ss-linkmaker-fields { grid-template-columns: 1fr; }
          .ss-card strong { font-size: 1.6rem; }
          .ss-chart { height: 160px; }
        }
      `}</style>
    </div>
  );
}

export default SiteStats;
