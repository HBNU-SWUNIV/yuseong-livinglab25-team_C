# 유성 안심 문자 서비스 - 관리자 대시보드

Figma 디자인을 기준으로 구현한 관리자 대시보드입니다.

## 프로젝트 구조

```
frontend/src/
├── components/
│   ├── Header/
│   │   └── Header.jsx          # 상단 헤더 (페이지 제목, 관리자 정보, 로그아웃)
│   ├── Layout/
│   │   └── Layout.jsx          # 메인 레이아웃 (사이드바 + 헤더 + 컨텐츠)
│   ├── Sidebar/
│   │   └── Sidebar.jsx         # 좌측 사이드바 (로고, 메뉴)
│   ├── StatCard/
│   │   └── StatCard.jsx        # KPI 통계 카드 컴포넌트
│   ├── MessageChart/
│   │   └── MessageChart.jsx    # 문자 발송 추이 차트 (recharts)
│   └── MessageTable/
│       └── MessageTable.jsx    # 최근 발송 내역 테이블
├── pages/
│   ├── Dashboard/
│   │   └── Dashboard.jsx      # 대시보드 메인 페이지
│   └── Login/
│       ├── Login.jsx
│       └── Login.css
├── styles/
│   └── global.css              # 전역 스타일 (Pretendard 폰트 포함)
└── App.jsx                     # 라우팅 설정
```

## 주요 기능

### 1. 좌측 사이드바
- 로고 영역 (유성 안심 문자)
- 메뉴 항목:
  - 대시보드
  - 문자 발송
  - 사용자 관리
  - 로그
  - 설정
- 현재 선택된 메뉴는 파란색으로 강조 표시

### 2. 상단 헤더
- 현재 페이지 제목 표시
- 관리자 정보 (아이콘 + 이름)
- 로그아웃 버튼

### 3. 대시보드 메인 영역
- **KPI 카드 4개:**
  - 오늘 발송 건수
  - 누적 발송 건수
  - 실패 건수
  - 등록 사용자 수
- **문자 발송 추이 차트:**
  - 최근 7일 데이터
  - 발송/성공/실패 추이를 라인 차트로 표시
  - recharts 라이브러리 사용
- **최근 발송 내역 테이블:**
  - 날짜, 수신자, 내용, 상태 컬럼
  - 성공/실패 상태 색상 구분

## 기술 스택

- **React 19.2.0** + **Vite 7.2.4**
- **JavaScript** (TypeScript 미사용)
- **styled-components** - 스타일링
- **recharts** - 차트 라이브러리
- **lucide-react** - 아이콘 라이브러리
- **react-router-dom** - 라우팅
- **Pretendard** - 폰트 (CDN)

## 스타일 가이드

### 색상
- Primary: `#2563eb` (파란색)
- Success: `#10b981` (초록색)
- Error: `#ef4444` (빨간색)
- Background: `#f5f7fa` (연한 회색)
- Border: `#e5e7eb` (회색)

### 반응형
- 최소 너비: 1280px 기준
- 그리드 레이아웃: 4열 → 2열 → 1열로 자동 조정

## 데이터 처리

현재는 더미 데이터를 사용합니다:
- `Dashboard.jsx`의 `getDashboardStats()` 함수
- `MessageChart.jsx`의 `generateChartData()` 함수
- `MessageTable.jsx`의 `generateTableData()` 함수

나중에 실제 API 연동 시 이 함수들을 API 호출로 교체하면 됩니다.

## 실행 방법

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 라우팅

- `/login` - 로그인 페이지
- `/dashboard` - 대시보드 (기본 페이지)
- `/messages` - 문자 발송 (구현 예정)
- `/users` - 사용자 관리 (구현 예정)
- `/logs` - 로그 (구현 예정)
- `/settings` - 설정 (구현 예정)

## Figma 디자인과의 차이점

현재 구현은 Figma 디자인의 기본 구조를 따르되, 다음 사항들은 실제 구현 시 조정이 필요할 수 있습니다:

1. **색상 값**: Figma의 정확한 색상 코드가 필요하면 디자인 파일에서 확인 후 수정
2. **간격/패딩**: 디자인 시스템의 spacing 규칙에 맞춰 조정 가능
3. **폰트 크기**: 디자인 시스템의 typography 규칙에 맞춰 조정 가능
4. **아이콘**: lucide-react의 아이콘이 Figma와 다를 수 있음 (필요시 교체)

## 향후 개선 사항

1. 실제 API 연동
2. 인증/인가 처리 (ProtectedRoute)
3. 로딩 상태 처리
4. 에러 처리
5. 페이지네이션 (테이블)
6. 필터링/검색 기능




