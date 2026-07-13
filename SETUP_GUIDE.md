// 이 파일은 참고 문서입니다.
// 아래의 페이지들이 필요합니다:

// 1. AccommodationDetail.jsx - 숙소 상세 페이지 + 예약 + Stripe 결제
// 2. HostAccommodations.jsx - 호스트의 숙소 관리 페이지
// 3. Profile.jsx - 사용자 프로필 페이지

// ===============================================
// Supabase 데이터베이스 구조 (SQL)
// ===============================================

/*
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('missionary', 'host', 'admin')),
  church_name TEXT NOT NULL,
  church_address TEXT,
  phone TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_docs TEXT[],
  rejection_reason TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 숙소 테이블
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  price DECIMAL NOT NULL,
  capacity INT NOT NULL,
  bedrooms INT,
  bathrooms INT,
  images TEXT[],
  amenities TEXT[],
  status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 예약 테이블
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  guest_id UUID NOT NULL REFERENCES users(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_intent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 리뷰 테이블
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  guest_id UUID NOT NULL REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  accommodation_id UUID REFERENCES accommodations(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 스토리지 버킷 (검증 문서, 숙소 이미지)
-- Supabase 대시보드에서 생성:
-- 1. verification-docs (비공개)
-- 2. accommodation-images (공개)
*/

// ===============================================
// Netlify 배포 가이드
// ===============================================

/*
1. GitHub에 코드 푸시
   - git init
   - git add .
   - git commit -m "Initial commit"
   - git branch -M main
   - git remote add origin https://github.com/YOUR_USERNAME/missionaries-hosting.git
   - git push -u origin main

2. Netlify에 연결
   - https://app.netlify.com으로 이동
   - "Connect from Git" 클릭
   - GitHub 계정 연결
   - 저장소 선택
   - Build settings:
     - Base directory: (비워두기)
     - Build command: npm run build
     - Publish directory: build

3. 환경 변수 설정
   - Netlify 대시보드 > Site settings > Environment
   - REACT_APP_SUPABASE_URL = your-supabase-url
   - REACT_APP_SUPABASE_ANON_KEY = your-anon-key
   - REACT_APP_STRIPE_PUBLISHABLE_KEY = your-stripe-key

4. 자동 배포
   - main 브랜치에 push하면 자동 배포됨
*/

// ===============================================
// .env.local 파일 (로컬 개발용)
// ===============================================

/*
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
*/

// ===============================================
// 스토리지 정책 (Supabase)
// ===============================================

/*
verification-docs (비공개):
- 업로드 정책: authenticated users만 가능
- 다운로드 정책: authenticated users만 가능

accommodation-images (공개):
- 업로드 정책: authenticated users만 가능
- 다운로드 정책: 공개 (SELECT for authenticated and anonymous users)
*/

// ===============================================
// 추가 구현 항목
// ===============================================

/*
[ ] AccommodationDetail.jsx
  - 숙소 상세 정보 표시
  - 날짜 선택 캘린더
  - 호스트 정보
  - 리뷰 표시
  - Stripe 결제 폼

[ ] HostAccommodations.jsx
  - 호스트의 등록된 숙소 목록
  - 숙소 등록/수정/삭제
  - 예약 관리
  - 수입 대시보드

[ ] Profile.jsx
  - 사용자 정보 수정
  - 프로필 이미지 업로드
  - 비밀번호 변경
  - 계정 설정

[ ] Messages 시스템
  - 호스트-게스트 메시지
  - 실시간 업데이트 (Supabase 리스너)

[ ] Stripe 통합
  - 결제 처리
  - 예약 확정
  - 환불 처리

[ ] 이메일 알림 (Supabase Functions 또는 외부 서비스)
  - 가입 승인
  - 숙소 승인
  - 예약 확정
  - 메시지 알림
*/

export default function SetupGuide() {
  return null;
}
