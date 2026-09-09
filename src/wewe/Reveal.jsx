import React, { useEffect, useRef, useState } from 'react';

// 위위 전체 홈페이지 공용 "떠오르는" 등장 애니메이션 래퍼.
// 위위 스테이 랜딩페이지(src/pages/LandingPage.jsx)의 히어로 섹션에 적용되어 있던
// "opacity 0 → 1 + 아래에서 위로 살짝 떠오르는" 효과(.hero { animation: fadeIn }-와 동일한
// 느낌)를 모든 위위 페이지의 각 섹션/요소에 재사용할 수 있도록 IntersectionObserver 기반
// 컴포넌트로 일반화했습니다. 화면에 처음 걸쳐지는 순간(이미 화면 안이면 마운트 즉시) 한 번만
// 애니메이션이 실행되고, 이후에는 다시 스크롤이 나가도 사라지지 않습니다(reveal-once).
//
// as: 감싸는 태그(기본 div). delay: 밀리초(ms) 단위 지연(스태거 효과용, 예: 80, 120).
// className: 추가 클래스. style/그 외 props는 감싸는 태그에 그대로 전달됩니다(배경 이미지,
// role/aria-label 등을 쓸 수 있도록).
function Reveal({ children, as = 'div', delay = 0, className = '', style, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const Tag = as;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // prefers-reduced-motion인 경우 애니메이션 없이 바로 보여줍니다.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mergedStyle = delay ? { ...style, transitionDelay: `${delay}ms` } : style;

  return (
    <Tag
      ref={ref}
      className={`wp-reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
