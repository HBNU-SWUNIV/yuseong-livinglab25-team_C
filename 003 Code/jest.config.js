module.exports = {
  // 테스트 환경 설정
  testEnvironment: 'node',
  
  // 테스트 파일 패턴
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 테스트 전 실행할 설정 파일
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/initDatabase.js'
  ],
  
  // 테스트 타임아웃 (데이터베이스 연결 시간 고려)
  testTimeout: 30000,
  
  // 병렬 실행 비활성화 (데이터베이스 테스트 안정성)
  maxWorkers: 1,
  
  // 상세한 출력
  verbose: true
};