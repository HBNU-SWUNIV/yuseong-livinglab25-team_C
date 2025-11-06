# 프론트엔드 컴포넌트 테스트

이 디렉토리에는 유성안심문자 관리자 패널의 주요 컴포넌트들에 대한 단위 테스트와 통합 테스트가 포함되어 있습니다.

## 테스트 파일 구조

### 인증 관련 테스트
- `AuthContext.test.js` - 인증 컨텍스트 테스트
- `Login.test.js` - 로그인 컴포넌트 테스트
- `ProtectedRoute.test.js` - 보호된 라우트 테스트

### 수신자 관리 테스트
- `Recipients.test.js` - 수신자 목록 및 관리 테스트
- `RecipientModal.test.js` - 수신자 등록/수정 모달 테스트
- `CsvUpload.test.js` - CSV 파일 업로드 테스트

### 메시지 관리 테스트
- `Messages.test.js` - 메시지 예약 및 이력 관리 테스트

### 대시보드 및 앱 테스트
- `Dashboard.test.js` - 대시보드 통계 및 표시 테스트
- `App.test.js` - 전체 앱 라우팅 및 통합 테스트

## 테스트 실행 방법

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test -- Login.test.js

# 테스트 커버리지 확인
npm test -- --coverage --watchAll=false

# 테스트 한 번만 실행 (watch 모드 비활성화)
npm test -- --watchAll=false
```

## 테스트 커버리지

이 테스트들은 다음 요구사항들을 검증합니다:

### 요구사항 3.1 (관리자 인증)
- 로그인 폼 동작
- 인증 상태 관리
- 보호된 라우트 접근 제어
- 토큰 기반 인증

### 요구사항 5.1 (수신자 관리)
- 수신자 목록 조회
- 수신자 등록/수정/삭제
- CSV 파일 업로드
- 데이터 유효성 검증

## 주요 테스트 시나리오

### 사용자 인터랙션 테스트
1. **로그인 프로세스**
   - 폼 입력 및 제출
   - 유효성 검사
   - 성공/실패 처리

2. **수신자 관리**
   - 목록 조회 및 검색
   - 모달을 통한 등록/수정
   - CSV 파일 업로드
   - 데이터 검증

3. **메시지 관리**
   - 메시지 예약
   - 발송 이력 조회
   - 미리보기 기능
   - 글자 수 제한

4. **대시보드**
   - 통계 정보 표시
   - 최근 메시지 목록
   - API 오류 처리

## 테스트 설정

- **Testing Library**: React Testing Library 사용
- **Mock**: API 호출 및 localStorage 모킹
- **Setup**: `setupTests.js`에서 전역 설정
- **Coverage**: Jest 내장 커버리지 도구 사용

## 주의사항

1. 모든 API 호출은 모킹되어 있습니다
2. localStorage는 각 테스트마다 초기화됩니다
3. 비동기 작업은 `waitFor`를 사용하여 처리합니다
4. 사용자 인터랙션은 `fireEvent`를 사용하여 시뮬레이션합니다