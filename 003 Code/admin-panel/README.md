# 유성안심문자 관리자 패널

유성안심문자 서비스의 관리자 웹 패널입니다.

## 기능

- 관리자 인증 및 권한 관리
- 수신자 관리 (등록, 수정, 삭제, CSV 업로드)
- 메시지 관리 (예약 발송, 이력 조회)
- 맞춤 알림 설정
- 대시보드 (통계 및 시스템 상태)

## 기술 스택

- React 18
- React Router DOM
- Axios (API 통신)
- Styled Components (스타일링)

## 개발 환경 설정

### 필수 요구사항

- Node.js 16 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 빌드
npm run build

# 테스트 실행
npm test
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout/         # 레이아웃 컴포넌트
│   ├── Header/         # 헤더 컴포넌트
│   ├── Sidebar/        # 사이드바 컴포넌트
│   ├── Footer/         # 푸터 컴포넌트
│   └── ProtectedRoute/ # 보호된 라우트 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── Login/          # 로그인 페이지
│   ├── Dashboard/      # 대시보드
│   ├── Recipients/     # 수신자 관리
│   ├── Messages/       # 메시지 관리
│   └── CustomReminders/ # 맞춤 알림
├── contexts/           # React Context
│   └── AuthContext.js  # 인증 컨텍스트
├── App.js              # 메인 앱 컴포넌트
└── index.js            # 앱 진입점
```

## API 연동

백엔드 서버와의 통신을 위해 `proxy` 설정이 되어 있습니다.
개발 환경에서는 `http://localhost:3001`로 API 요청이 프록시됩니다.

## 반응형 디자인

모바일, 태블릿, 데스크톱 환경을 모두 지원하는 반응형 디자인이 적용되어 있습니다.

- 모바일: 480px 이하
- 태블릿: 768px 이하
- 데스크톱: 768px 초과