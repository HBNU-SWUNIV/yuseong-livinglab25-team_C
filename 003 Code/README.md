# Yuseong Care SMS

유성안심문자 서비스 - 고령층을 위한 SMS 기반 정보 제공 시스템

## 개요

유성안심문자는 디지털 취약계층, 특히 고령층에게 문자(SMS)를 통해 생활 필수 정보를 자동 제공하는 서비스입니다. 스마트폰이나 앱 없이도 피처폰으로 날씨, 미세먼지, 폭염·한파, 복지·보건 공지 등의 정보를 받을 수 있습니다.

## 주요 기능

- **일일 날씨 정보**: 매일 오전 7시 날씨 및 미세먼지 정보 자동 발송
- **긴급 알림**: 폭염, 한파, 재난 상황 시 즉시 알림
- **맞춤 알림**: 개인별 복용약, 병원 방문일 등 맞춤 알림
- **관리자 패널**: 수신자 관리, 메시지 예약, 발송 통계 확인
- **공공 데이터 연동**: 기상청, 환경부, 행정안전부 API 연동

## 기술 스택

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **SMS Gateway**: Naver Cloud Platform SMS
- **Scheduler**: node-cron
- **Logging**: Winston
- **Authentication**: JWT

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값들을 설정합니다.

```bash
cp .env.example .env
```

### 3. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 연결 정보를 `.env` 파일에 설정합니다.

### 4. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 5. 테스트 실행

```bash
npm test
```

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 관리자 로그인

### 수신자 관리
- `GET /api/recipients` - 수신자 목록 조회
- `POST /api/recipients` - 수신자 등록
- `PUT /api/recipients/:id` - 수신자 정보 수정
- `DELETE /api/recipients/:id` - 수신자 삭제

### 메시지 관리
- `GET /api/messages` - 메시지 이력 조회
- `POST /api/messages/schedule` - 메시지 예약
- `POST /api/messages/send` - 즉시 발송

## 프로젝트 구조

```
src/
├── config/          # 설정 파일
├── controllers/     # 컨트롤러
├── middleware/      # 미들웨어
├── models/          # 데이터 모델
├── routes/          # 라우트 정의
├── services/        # 비즈니스 로직
├── utils/           # 유틸리티 함수
└── server.js        # 서버 진입점
```

## 라이선스

MIT License

## 문의

유성구청 정보통신과