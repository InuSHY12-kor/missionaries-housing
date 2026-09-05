import React from 'react';

// /about, /about/ministries, /about/leadership 등 WEWE 소개 계열 하위 페이지가
// 공통으로 사용하는 작은 히어로 배너. 히어로 바로 아래에 AboutSubNav(children)를
// 함께 넣어서 세 페이지 사이를 오갈 수 있게 합니다.
function WevePageHero({ eyebrow, title, subtitle, children }) {
  return (
    <section className="wp-hero">
      {eyebrow && <span className="wp-hero-eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </section>
  );
}

export default WevePageHero;
