# 🏠 선교사 커뮤니티 숙소 공유 플랫폼 (2025/2026 버전)

완전한 선교사 커뮤니티 숙소 공유 플랫폼입니다. 신뢰할 수 있는 검증 시스템과 간편한 예약 시스템을 갖추고 있습니다.

**✨ 최신 기술 스택 (2025/2026)**
- **React 18.2** + React Router 6.20
- **Supabase** (PostgreSQL 데이터베이스 + 인증)
- **Netlify** (Git 기반 자동 배포)
- **Stripe** (결제 처리)

## 📋 시스템 구성

```
선교사 숙소 공유 플랫폼
├── 프론트엔드: React 18.2 (Netlify에 배포)
├── 백엔드: Supabase (PostgreSQL + Auth + Storage)
├── 배포: Netlify (Git 자동 배포)
└── 결제: Stripe (선택사항)
```

## ✨ 주요 기능

### 1. 회원 검증 시스템
- ✅ 선교사/호스트 회원가입
- ✅ 검증 문서 업로드 (사진)
- ✅ 관리자 승인 대기 페이지
- ✅ 자동 거절 사유 알림

### 2. 숙소 검증 시스템
- ✅ 호스트가 숙소 등록
- ✅ 관리자 1차 검토
- ✅ 승인된 숙소만 공개
- ✅ 거절 시 수정 요청

### 3. 예약 및 결제
- ✅ 날짜 기반 검색/예약
- ✅ Stripe 결제 시스템
- ✅ 예약 상태 관리
- ✅ 예약 확인 메일

### 4. 관리자 대시보드
- ✅ 승인 대기 사용자 목록
- ✅ 승인 대기 숙소 목록
- ✅ 승인/거절 기능
- ✅ 실시간 알림

---

## 🚀 빠른 시작 (5단계)

### Step 1: Supabase 셋업 (3분)

1. https://supabase.com에 가입
2. 새 프로젝트 생성
3. SQL 에디터에서 아래 코드 실행:

```sql
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
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 숙소 테이블
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES accommodations(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 권한 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

4. 스토리지 버킷 생성:
   - **Settings > Storage** 이동
   - "Create a new bucket" 클릭
   - `verification-docs` 생성 (비공개)
   - `accommodation-images` 생성 (공개)

5. 관리자 계정 수동 생성:
   - Supabase 대시보드의 **Auth > Users**
   - "Add user" 클릭하여 관리자 계정 생성
   - 그 후 users 테이블에서 role을 'admin'으로 설정

### Step 2: Stripe 셋업 (선택사항, 2분)

1. https://stripe.com에 가입
2. 테스트 모드에서 API 키 복사
3. Publishable Key 메모해두기

### Step 3: GitHub에 코드 푸시 (3분)

```bash
# 프로젝트 디렉토리로 이동
cd missionaries-hosting

# Git 초기화
git init
git add .
git commit -m "Initial commit: Missionaries Hosting Platform"

# GitHub에 푸시
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/missionaries-hosting.git
git push -u origin main
```

### Step 4: Netlify 배포 (2분)

1. https://app.netlify.com로 이동
2. "Add new site" → "Connect to Git" 선택
3. GitHub 계정 연결 및 저장소 선택
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Environment variables 설정:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key (선택사항)
   ```
6. "Deploy site" 클릭

### Step 5: 환경 변수 설정 (1분)

**로컬 개발용**: 프로젝트 루트에 `.env.local` 파일 생성:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

---

## 💻 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# 프로덕션 빌드
npm run build
```

**브라우저**: http://localhost:3000

---

## 📊 사용자 플로우

### 게스트 (숙소 예약)
```
1. 가입 (검증 문서 업로드)
   ↓
2. 관리자 승인 대기
   ↓
3. 승인됨 → 숙소 검색/예약 가능
   ↓
4. 날짜 선택 → 결제 → 예약 완료
```

### 호스트 (숙소 제공)
```
1. 가입 (검증 문서 업로드)
   ↓
2. 관리자 승인 대기
   ↓
3. 승인됨 → 숙소 등록 가능
   ↓
4. 숙소 등록 → 관리자 검토
   ↓
5. 숙소 승인됨 → 공개/예약 가능
   ↓
6. 예약 관리 → 수입 추적
```

### 관리자
```
1. 관리자 계정 로그인
   ↓
2. 대기 중인 사용자 검토 → 승인/거절
   ↓
3. 대기 중인 숙소 검토 → 승인/거절
   ↓
4. 커뮤니티 관리
```

---

## 📱 주요 페이지

| 페이지 | 기능 | 접근 권한 |
|--------|------|---------|
| `/` | 랜딩 페이지 | 모두 |
| `/signup` | 회원가입 | 미인증 |
| `/dashboard` | 대시보드 | 승인된 사용자 |
| `/accommodations` | 숙소 검색 | 승인된 사용자 |
| `/my-accommodations` | 숙소 관리 | 호스트 |
| `/admin` | 관리자 대시보드 | 관리자 |
| `/profile` | 프로필 | 로그인 사용자 |

---

## 🔐 보안 기능

- ✅ Supabase Row Level Security (RLS)
- ✅ 이메일 검증
- ✅ 관리자 승인 시스템
- ✅ HTTPS 자동 적용 (Netlify)
- ✅ 환경 변수 보안

---

## 💰 비용 정보

### 무료 범위
- **Netlify**: 완전 무료 배포
- **Supabase**: 
  - 500MB 데이터베이스
  - 2GB 파일 스토리지
  - 월 50,000 API 호출
  - 무제한 사용자 인증
- **Stripe**: 거래 수수료만 (2.9% + $0.30)

### 성장 시 업그레이드
- **Netlify Pro**: $19/month (더 많은 빌드 시간)
- **Supabase Pro**: $25/month (더 많은 데이터/API)
- **Stripe**: 자동으로 사용량 기반

---

## 🛠️ 추가 개선 항목

- [ ] 이메일 알림 (Supabase Functions)
- [ ] 검증 문서 자동 검증 (OCR)
- [ ] 고급 검색 필터
- [ ] 별점/리뷰 시스템
- [ ] 호스트 수입 대시보드
- [ ] 모바일 앱 (React Native)
- [ ] 다국어 지원
- [ ] 신고/블록 기능

---

## 📞 지원

문제가 발생하면:

1. **Supabase 문서**: https://supabase.com/docs
2. **Netlify 문서**: https://docs.netlify.com
3. **React 문서**: https://react.dev

---

## 📄 라이선스

MIT License - 자유롭게 사용하실 수 있습니다.

---

## 축하합니다! 🎉

선교사 커뮤니티 숙소 공유 플랫폼이 배포되었습니다!

**다음 단계**:
1. 관리자 계정으로 로그인
2. 테스트 사용자 몇 명 생성
3. 승인/거절 프로세스 테스트
4. 실제 운영 시작
