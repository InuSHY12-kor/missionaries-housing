import { useCallback, useEffect, useState } from 'react';

// 김바름 웹 관리실의 "Claude와 작업 중" 표시 (2026-10-20).
// Claude가 작업하면 이 저장소(공개)에 브랜치 푸시·PR 생성/수정이 생기므로, GitHub 공개 API로
// 가장 최근 활동 시각을 보고 DEV_ACTIVE_MIN분 안이면 "작업 중"으로 봅니다(비밀 키 불필요).
// 비로그인 GitHub API는 IP당 시간당 60회 제한이 있어 3분마다(탭이 보일 때만) 2회 호출합니다.

export const REPO = 'InuSHY12-kor/missionaries-housing';
export const DEV_ACTIVE_MIN = 20;
const POLL_MS = 3 * 60 * 1000;

export function summarizeRepo(pulls, activity, now = new Date()) {
  const candidates = [];
  const pr = (pulls || [])[0];
  if (pr?.updated_at) {
    candidates.push({
      at: new Date(pr.updated_at),
      label: `PR #${pr.number} ${pr.title}`,
      url: pr.html_url,
    });
  }
  const act = (activity || [])[0];
  if (act?.timestamp) {
    const branch = String(act.ref || '').replace('refs/heads/', '');
    const kind = act.activity_type === 'pr_merge' ? '병합' : act.activity_type === 'branch_creation' ? '브랜치 생성' : '푸시';
    candidates.push({ at: new Date(act.timestamp), label: `${branch} ${kind}` });
  }
  if (candidates.length === 0) return { working: false, at: null, label: '' };
  const latest = candidates.sort((a, b) => b.at - a.at)[0];
  const working = now - latest.at < DEV_ACTIVE_MIN * 60 * 1000;
  return { working, ...latest };
}

export default function useRepoActivity({ fetchJson = defaultFetchJson } = {}) {
  const [state, setState] = useState({ working: false, at: null, label: '', error: '', checkedAt: null });

  const refresh = useCallback(async () => {
    try {
      const [pulls, activity] = await Promise.all([
        fetchJson(`https://api.github.com/repos/${REPO}/pulls?state=all&sort=updated&direction=desc&per_page=1`),
        fetchJson(`https://api.github.com/repos/${REPO}/activity?per_page=1`).catch(() => []),
      ]);
      setState({ ...summarizeRepo(pulls, activity), error: '', checkedAt: new Date() });
    } catch (e) {
      setState((s) => ({ ...s, working: false, error: e?.message || String(e), checkedAt: new Date() }));
    }
  }, [fetchJson]);

  useEffect(() => {
    let timer = null;
    const start = () => { if (!timer) timer = setInterval(refresh, POLL_MS); };
    const stop = () => { clearInterval(timer); timer = null; };
    const onVis = () => {
      if (document.hidden) stop();
      else { refresh(); start(); }
    };
    refresh();
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [refresh]);

  return state;
}

async function defaultFetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}
