# 🚀 선교사 숙소 공유 플랫폼 - 상세 배포 가이드 (2025/2026)

완초 초보자도 따라할 수 있도록 **매우 상세하게** 각 단계를 설명했습니다.
**각 단계마다 어디의 어떤 메뉴인지 정확히 표시**했습니다.

---

## 📌 사전 준비 (5분)

배포를 시작하기 전에 **3개의 무료 계정** 을 만들어야 합니다.

### 필요한 것:
- ✅ 이메일 주소 (1개)
- ✅ 인터넷 연결
- ✅ 개발자 경험 X (초보자 환영!)

---

# 🎯 STEP 1: GitHub 계정 생성 (3분)

**GitHub**는 코드를 저장하는 저장소입니다. 여기에 코드를 올려야 Netlify가 자동으로 배포합니다.

### 1️⃣ GitHub 가입

**웹 브라우저** 열기 → 주소창에 이 주소 입력:
```
https://github.com/signup
```

**페이지가 로드되면 보이는 것:**
- 왼쪽: "GitHub" 로고
- 중앙: "Create your account" 제목과 입력창들

**입력하기:**
1. **"Username"** 입력란 → 원하는 사용자명 입력 (예: `my-missions-app`)
2. **"Email address"** 입력란 → 이메일 입력
3. **"Password"** 입력란 → 강한 비밀번호 입력
4. **"Create account"** 파란 버튼 클릭

**확인 메일:**
- 입력한 이메일로 GitHub 확인 메일이 옵니다
- 이메일 열어서 **"Verify email address"** 링크 클릭
- 이제 GitHub 계정 생성 완료! ✅

---

# 🎯 STEP 2: Supabase 셋업 (10분)

**Supabase**는 데이터베이스입니다. 사용자 정보, 숙소 정보, 예약 정보 등을 저장합니다.

## 2-1️⃣ Supabase 계정 생성

**웹 브라우저 열기** → 주소창에 입력:
```
https://supabase.com/
```

**페이지 우측 상단 버튼들:**
- "Sign In" 버튼을 찾아 클릭하거나
- 우측 상단의 **"Start your project"** 버튼 클릭

**로그인 옵션:**
- 👉 **"Continue with GitHub"** 버튼 클릭 (가장 간단)
- 아까 만든 GitHub 계정으로 로그인
- Supabase가 GitHub 접근 권한을 묻습니다 → **"Authorize"** 클릭

**가입 완료!** ✅

---

## 2-2️⃣ Supabase 새 프로젝트 생성

로그인 후 보이는 페이지:

**화면 왼쪽 상단:**
- "Supabase" 로고와 프로젝트 목록
- **"New project"** 버튼 (보통 우측 상단) 또는 **"+"** 아이콘 클릭

**프로젝트 생성 화면:**

| 입력 항목 | 입력할 내용 |
|---------|-----------|
| **Project Name** | `missionaries-housing` (또는 원하는 이름) |
| **Database Password** | `YourStrong123!@#Password` (강한 비밀번호 - **꼭 메모하기!**) |
| **Region** | `Asia Pacific (Singapore)` 또는 `Europe (Ireland)` 선택 |
| **Pricing Plan** | `Free` 선택 (무료) |

**"Create new project" 버튼 클릭**

💾 **중요: 비밀번호를 안전한 곳에 메모해두세요!**

**⏳ 대기:**
- 프로젝트 초기화에 약 **1-2분** 소요
- 진행률 바가 표시됨
- 완료되면 대시보드가 로드됨

---

## 2-3️⃣ Supabase API 키 복사

**프로젝트 대시보드 왼쪽 사이드바:**
```
Project Settings (맨 아래) → API
```

**API 페이지:**
- "Project URL" 항목 아래 파란 텍스트 (예: `https://xyzabc.supabase.co`)
- 우측에 **복사 아이콘 (📋)** 클릭 → URL 복사
- **메모장**에 붙여넣기 (이름: `SUPABASE_URL`)

**같은 페이지에서 "Keys" 섹션:**
- **"anon public"** 버튼 아래 긴 텍스트 보임
- 우측 **복사 아이콘 (📋)** 클릭
- **메모장**에 붙여넣기 (이름: `SUPABASE_ANON_KEY`)

✅ **이제 2개의 중요한 키를 저장했습니다!**

---

## 2-4️⃣ Supabase 데이터베이스 테이블 생성

**왼쪽 사이드바에서:**
```
SQL Editor (또는 SQL 아이콘)
```

**SQL Editor 페이지:**
- 큰 텍스트 입력 창
- 아래 **"RUN"** 파란 버튼

**아래 SQL 코드를 **복사해서** 입력창에 **모두 붙여넣기**:**

```sql
-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS accommodations (
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
CREATE TABLE IF NOT EXISTS bookings (
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
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES accommodations(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

**"RUN" 버튼 클릭**

✅ **완료!** 테이블들이 생성되었습니다.

---

## 2-5️⃣ Supabase 스토리지 버킷 생성 (선택사항)

**왼쪽 사이드바:**
```
Storage
```

**Storage 페이지:**
- **"Create a new bucket"** 버튼 클릭

**Bucket 생성 1:**
- **Name**: `verification-docs`
- **Public bucket** 스위치: **OFF** (비공개)
- **Create bucket** 클릭

**Bucket 생성 2:**
- **"Create a new bucket"** 다시 클릭
- **Name**: `accommodation-images`
- **Public bucket** 스위치: **ON** (공개)
- **Create bucket** 클릭

✅ **Supabase 셋업 완료!**

---

# 🎯 STEP 3: 로컬에서 코드 준비 (5분)

이제 **컴퓨터의 폴더**에서 코드를 준비합니다.

## 3-1️⃣ 프로젝트 폴더 다운로드

**이 가이드가 있는 폴더:**
```
missionaries-hosting/
```

이 폴더를 **컴퓨터 어딘가에** 저장해두세요.
(예: `C:\Users\YourName\Documents\missionaries-hosting`)

## 3-2️⃣ 환경 변수 파일 생성

**프로젝트 폴더를 열고** (예: VS Code에서):

**프로젝트 루트에** 새 파일 생성:
```
.env.local
```

파일에 아래 내용을 **붙여넣기**:
```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_optional_key
```

**메모장에서 복사한 값들을 붙여넣기:**
- `https://your-project-ref.supabase.co` → **Supabase URL** 붙여넣기
- `your-anon-key-here` → **Supabase ANON KEY** 붙여넣기
- Stripe 키는 나중에 추가 (지금은 선택사항)

**파일 저장**

---

# 🎯 STEP 4: GitHub에 코드 올리기 (5분)

이제 코드를 GitHub에 업로드해야 합니다.

## 4-1️⃣ GitHub 새 저장소 생성

**GitHub 로그인된 페이지:**
```
https://github.com/new
```

**폼 입력:**
| 항목 | 입력 |
|-----|-----|
| **Repository name** | `missionaries-housing` |
| **Description** | `Missionary Community Housing Platform` |
| **Public/Private** | `Public` 선택 |
| **Initialize this repo** | **체크 안 함** (체크하면 안 됨) |

**"Create repository" 버튼 클릭**

**완료 후 보이는 페이지:**
- 저장소가 생성되고
- 명령어들이 표시됨 ("…or push an existing repository...")

---

## 4-2️⃣ 터미널에서 Git 명령어 실행

**터미널/명령 프롬프트 열기** (Windows: `cmd`, Mac: `Terminal`)

**프로젝트 폴더로 이동:**
```bash
cd C:\Users\YourName\Documents\missionaries-hosting
```

**아래 명령어들을 **한 줄씩** 실행** (복사해서 붙여넣기):

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit: Missionaries Hosting Platform"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/missionaries-housing.git
```
⚠️ **주의:** `YOUR_GITHUB_USERNAME`을 **자신의 GitHub 사용자명**으로 변경!

```bash
git push -u origin main
```

⏳ **대기:** 파일 업로드 중 (수십 초 소요)

✅ **완료!** GitHub에 코드가 올라갔습니다.

---

# 🎯 STEP 5: Netlify 배포 (5분)

이제 Netlify에서 자동 배포를 설정합니다.

## 5-1️⃣ Netlify 계정 생성

**웹 브라우저:**
```
https://app.netlify.com
```

**"Log in"** 또는 **"Sign up"** 클릭

**GitHub로 로그인:**
- **"Continue with GitHub"** 버튼 클릭
- GitHub 계정 선택
- **"Authorize Netlify"** 클릭

---

## 5-2️⃣ 배포 설정

Netlify 대시보드 (로그인 후):

**페이지 우측 상단 버튼:**
```
Add new site → Import an existing project
```

또는 **대시보드 중앙:**
```
"New site from Git" 버튼 클릭
```

**Git 제공자 선택:**
- **"GitHub"** 선택

**리포지토리 선택:**
- GitHub 로그인 요청 → 자신의 계정으로 로그인
- 저장소 목록에서 **`missionaries-housing`** 클릭

---

## 5-3️⃣ 빌드 설정

**배포 설정 페이지가 나타남:**

| 설정 항목 | 값 |
|---------|-----|
| **Branch to deploy** | `main` |
| **Build command** | `npm run build` |
| **Publish directory** | `build` |

**모두 입력되어 있는지 확인 후**

**"Deploy site" 버튼 클릭**

⏳ **빌드 중...** (1-3분 소요)
- 진행 상황이 실시간으로 표시됨
- "Build in progress"에서 "Build successful"로 변경됨

---

## 5-4️⃣ 환경 변수 설정

빌드가 실패하면 **환경 변수를 설정**해야 합니다.

**Netlify 대시보드:**
```
Site settings (사이트 선택 후)
→ Build & deploy 탭
→ Environment 섹션
```

**"Edit variables" 또는 "Add environment variable" 클릭**

**3개의 환경 변수 추가:**

| Key | Value |
|-----|-------|
| `REACT_APP_SUPABASE_URL` | `https://your-project.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `your-anon-key` |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (선택사항) |

**메모장에서 복사한 값들을 입력**

**"Save" 클릭**

---

## 5-5️⃣ 재배포 트리거

환경 변수 설정 후:

**사이트 대시보드:**
```
Deploys 탭
→ "Trigger deploy" 버튼
→ "Deploy site" 클릭
```

⏳ **재배포 중...**

✅ **완료!** 이제 사이트가 라이브입니다!

---

# 🎯 STEP 6: 관리자 계정 생성 (선택사항)

사이트가 라이브되면 관리자 계정을 만들어야 합니다.

## 6-1️⃣ Supabase에서 관리자 직접 생성

**Supabase 대시보드:**
```
Authentication (왼쪽 사이드바)
→ Users 탭
```

**"Add user" 또는 "Invite user" 버튼**

| 항목 | 값 |
|-----|-----|
| **Email** | `admin@example.com` (관리자 이메일) |
| **Password** | 강한 비밀번호 |
| **Auto Confirm user** | ✅ 체크 |

**"Create user" 또는 "Send invitation" 클릭**

## 6-2️⃣ 역할을 admin으로 설정

**Table Editor:**
```
왼쪽 사이드바 → users 테이블
```

**방금 생성한 사용자의 행 찾기:**
- 클릭해서 편집 모드 열기
- `role` 필드 → `admin`으로 변경
- `status` 필드 → `approved`로 변경
- 저장

---

# 🌍 최종 확인

## 배포된 사이트 확인

**Netlify 대시보드:**
```
Sites 탭 → missionaries-housing 클릭
```

**"Visit site" 버튼** 또는 **생성된 URL**:
```
https://your-site-name.netlify.app
```

---

# ✅ 체크리스트

배포 완료 확인:

- [ ] GitHub 계정 생성
- [ ] Supabase 프로젝트 생성
- [ ] Supabase API 키 복사
- [ ] 데이터베이스 테이블 생성 (SQL 실행)
- [ ] 환경 변수 파일 (.env.local) 생성
- [ ] GitHub에 코드 푸시
- [ ] Netlify 계정 생성
- [ ] Netlify에서 배포 설정
- [ ] 환경 변수 설정 (Netlify)
- [ ] 재배포 성공
- [ ] 관리자 계정 생성
- [ ] 라이브 사이트 확인

---

# 🎉 축하합니다!

모든 배포가 완료되었습니다! 🚀

## 다음 단계:

1. **관리자로 로그인**
   - 관리자 이메일 사용
   - 테스트 사용자 몇 명 생성

2. **테스트**
   - 회원가입 프로세스 테스트
   - 관리자 승인 테스트
   - 숙소 등록 테스트

3. **라이브 운영 시작**
   - 실제 사용자 초대
   - 호스트 모집
   - 커뮤니티 홍보

---

# 📞 문제가 생겼을 때

## 배포가 안 됨

**Netlify 대시보드:**
```
Deploys 탭 → 최신 배포 클릭 → "Deploy log" 확인
```

**에러 메시지 읽기:**
- 대부분 환경 변수 누락
- 또는 build command 오류

## API 연결 안 됨

**확인 사항:**
- ✅ Supabase URL이 정확한가?
- ✅ Anon Key가 정확한가?
- ✅ Row Level Security (RLS)가 활성화되어 있나?

## 화이트 스크린

**해결:**
1. Netlify: _redirects 파일 확인
2. 브라우저 콘솔 (F12): 에러 메시지 확인
3. Supabase SQL: CORS 정책 확인

---

## 📚 공식 문서

- **Supabase**: https://supabase.com/docs
- **Netlify**: https://docs.netlify.com
- **React**: https://react.dev

좋은 배포가 되길 바랍니다! 🎊
