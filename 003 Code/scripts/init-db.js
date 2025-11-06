/**
 * 데이터베이스 초기화 스크립트
 * Database initialization script
 */

const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 로드
const envPath = path.join(__dirname, '..', '.env.test');
console.log('환경 파일 경로:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('환경 파일 로드 실패:', result.error);
} else {
  console.log('환경 파일 로드 성공');
}

// 테스트용 비밀번호 직접 설정
process.env.DB_PASSWORD = 'MySQLHBNU100';
const { initializeDatabase, checkDatabaseHealth } = require('../src/config/initDatabase');
const logger = require('../src/utils/logger');

async function main() {
  try {
    console.log('데이터베이스 초기화를 시작합니다...');
    console.log('환경 변수 확인:');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
    console.log('전체 환경 변수:', Object.keys(process.env).filter(key => key.startsWith('DB_')));
    
    // 데이터베이스 초기화
    await initializeDatabase();
    
    // 헬스 체크
    const health = await checkDatabaseHealth();
    console.log('데이터베이스 상태:', health);
    
    console.log('데이터베이스 초기화가 완료되었습니다.');
    process.exit(0);
    
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error.message);
    process.exit(1);
  }
}

main();