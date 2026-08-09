import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/**
 * 재사용 가능한 월간 달력 그리드.
 * - isDisabled(dateStr): 선택 불가능한 날짜(과거/예약됨/차단됨) 여부
 * - isSelected(dateStr): 선택된 날짜(체크인/체크아웃 또는 호스트가 차단한 날짜) 여부
 * - isInRange(dateStr): 체크인~체크아웃 사이 날짜인지 여부 (선택 사항)
 * - onDayClick(dateStr): 날짜 클릭 콜백 (비활성화된 날짜는 클릭되지 않음)
 */
function Calendar({ isDisabled, isSelected, isInRange, onDayClick }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrev = () => {
    setViewMonth(m => {
      if (m === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goNext = () => {
    setViewMonth(m => {
      if (m === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  return (
    <div className="wewe-calendar">
      <div className="cal-header">
        <button type="button" className="cal-nav-btn" onClick={goPrev} aria-label="이전 달">
          <ChevronLeft size={18} />
        </button>
        <span className="cal-title">{viewYear}년 {viewMonth + 1}월</span>
        <button type="button" className="cal-nav-btn" onClick={goNext} aria-label="다음 달">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map(w => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d, idx) => {
          if (d === null) {
            return <div key={`empty-${idx}`} className="cal-cell empty" />;
          }
          const dateStr = toDateStr(viewYear, viewMonth, d);
          const disabled = isDisabled ? isDisabled(dateStr) : false;
          const selected = isSelected ? isSelected(dateStr) : false;
          const inRange = isInRange ? isInRange(dateStr) : false;

          return (
            <button
              type="button"
              key={dateStr}
              className={[
                'cal-cell',
                'cal-day',
                disabled ? 'disabled' : '',
                selected ? 'selected' : '',
                inRange ? 'in-range' : ''
              ].filter(Boolean).join(' ')}
              disabled={disabled}
              onClick={() => onDayClick && onDayClick(dateStr)}
            >
              {d}
            </button>
          );
        })}
      </div>

      <style>{`
        .wewe-calendar {
          background: white;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          padding: 1rem;
        }

        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .cal-title {
          font-weight: 600;
          color: #2c3e50;
        }

        .cal-nav-btn {
          background: none;
          border: 1px solid #ecf0f1;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #2c3e50;
          transition: background 0.2s;
        }

        .cal-nav-btn:hover {
          background: #f0f9fa;
        }

        .cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 0.25rem;
        }

        .cal-weekday {
          text-align: center;
          font-size: 0.8rem;
          color: #95a5a6;
          padding: 0.25rem 0;
        }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .cal-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cal-cell.empty {
          background: transparent;
        }

        .cal-day {
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          color: #2c3e50;
          transition: background 0.15s, color 0.15s;
        }

        .cal-day:hover:not(.disabled) {
          background: #e6f4f5;
        }

        .cal-day.disabled {
          color: #cbd5d9;
          background: #f5f6f7;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .cal-day.in-range {
          background: #cceaec;
          border-radius: 0;
        }

        .cal-day.selected {
          background: #16808E;
          color: white;
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .cal-day {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Calendar;
