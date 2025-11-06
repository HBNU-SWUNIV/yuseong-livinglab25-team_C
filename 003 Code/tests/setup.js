// 테스트 설정 파일
const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 로드
const envPath = path.join(__dirname, '..', '.env.test');
dotenv.config({ path: envPath });

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'yuseong_care_sms_test';
process.env.LOG_LEVEL = 'error';
process.env.DB_PASSWORD = 'MySQLHBNU100'; // 직접 설정

// 전역 테스트 타임아웃 설정
jest.setTimeout(30000);

// 테스트 전역 설정
beforeAll(() => {
  // 테스트 시작 시 로그 출력 최소화
  console.log('테스트 환경 초기화 중...');
});

afterAll(() => {
  // 테스트 완료 후 정리
  console.log('테스트 완료');
});