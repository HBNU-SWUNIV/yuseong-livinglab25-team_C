-- 유성안심문자 데이터베이스 스키마
-- Database Schema for Yuseong Care SMS System

-- 데이터베이스 생성 (필요시)
CREATE DATABASE IF NOT EXISTS yuseong_care_sms 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS yuseong_care_sms_test 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 환경에 따라 적절한 데이터베이스 사용
-- USE 명령어는 초기화 스크립트에서 동적으로 처리

-- 수신자 테이블
CREATE TABLE IF NOT EXISTS recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '수신자 이름',
    phone_number VARCHAR(15) UNIQUE NOT NULL COMMENT '전화번호',
    address VARCHAR(200) COMMENT '주소',
    birth_date DATE COMMENT '생년월일',
    emergency_contact VARCHAR(15) COMMENT '비상연락처',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    INDEX idx_phone_number (phone_number),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='수신자 정보';

-- 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('daily', 'emergency', 'welfare', 'custom') NOT NULL COMMENT '메시지 유형',
    title VARCHAR(100) COMMENT '메시지 제목',
    content TEXT NOT NULL COMMENT '메시지 내용',
    scheduled_at TIMESTAMP NULL COMMENT '예약 발송 시간',
    sent_at TIMESTAMP NULL COMMENT '실제 발송 시간',
    status ENUM('pending', 'sending', 'sent', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '발송 상태',
    recipient_count INT DEFAULT 0 COMMENT '대상 수신자 수',
    success_count INT DEFAULT 0 COMMENT '발송 성공 수',
    failed_count INT DEFAULT 0 COMMENT '발송 실패 수',
    created_by VARCHAR(50) COMMENT '생성자',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_sent_at (sent_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='메시지 정보';

-- 메시지 발송 로그 테이블
CREATE TABLE IF NOT EXISTS message_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL COMMENT '메시지 ID',
    recipient_id INT COMMENT '수신자 ID',
    phone_number VARCHAR(15) NOT NULL COMMENT '발송 전화번호',
    status ENUM('sent', 'failed') NOT NULL COMMENT '발송 상태',
    error_message TEXT COMMENT '오류 메시지',
    gateway_response JSON COMMENT 'SMS 게이트웨이 응답',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '발송 시도 시간',
    
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE SET NULL,
    
    INDEX idx_message_id (message_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_phone_number (phone_number),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB COMMENT='메시지 발송 로그';

-- 맞춤 알림 테이블
CREATE TABLE IF NOT EXISTS custom_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipient_id INT NOT NULL COMMENT '수신자 ID',
    title VARCHAR(100) NOT NULL COMMENT '알림 제목',
    message TEXT NOT NULL COMMENT '알림 메시지',
    schedule_type ENUM('daily', 'weekly', 'monthly') NOT NULL COMMENT '반복 유형',
    schedule_time TIME NOT NULL COMMENT '발송 시간',
    schedule_day INT COMMENT '발송 요일(주간: 1-7) 또는 일(월간: 1-31)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    created_by VARCHAR(50) COMMENT '설정자 (가족 등)',
    last_sent_at TIMESTAMP NULL COMMENT '마지막 발송 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
    
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_schedule_type (schedule_type),
    INDEX idx_schedule_time (schedule_time),
    INDEX idx_is_active (is_active),
    INDEX idx_last_sent_at (last_sent_at)
) ENGINE=InnoDB COMMENT='맞춤 알림 설정';

-- 공공 데이터 캐시 테이블
CREATE TABLE IF NOT EXISTS public_data_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data_type ENUM('weather', 'air_quality', 'disaster') NOT NULL COMMENT '데이터 유형',
    region VARCHAR(50) DEFAULT '유성구' COMMENT '지역',
    data JSON NOT NULL COMMENT '캐시된 데이터',
    expires_at TIMESTAMP NOT NULL COMMENT '만료 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    UNIQUE KEY unique_data_type_region (data_type, region),
    INDEX idx_data_type (data_type),
    INDEX idx_region (region),
    INDEX idx_expires_at (expires_at),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB COMMENT='공공 데이터 캐시';

-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '사용자명',
    password VARCHAR(255) NOT NULL COMMENT '암호화된 비밀번호',
    name VARCHAR(100) NOT NULL COMMENT '관리자 이름',
    role ENUM('admin', 'operator') DEFAULT 'operator' COMMENT '권한 역할',
    email VARCHAR(100) COMMENT '이메일',
    phone VARCHAR(15) COMMENT '전화번호',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    last_login_at TIMESTAMP NULL COMMENT '마지막 로그인 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB COMMENT='관리자 계정';

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL COMMENT '설정 키',
    setting_value TEXT COMMENT '설정 값',
    description VARCHAR(255) COMMENT '설정 설명',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB COMMENT='시스템 설정';

-- 초기 관리자 계정 생성 (비밀번호: admin123)
INSERT IGNORE INTO admins (username, password, name, role, email) 
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G', '시스템 관리자', 'admin', 'admin@yuseong.go.kr');

-- 기본 시스템 설정 값
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('daily_weather_time', '07:00', '일일 날씨 발송 시간'),
('weather_fetch_interval', '60', '날씨 데이터 수집 간격 (분)'),
('air_quality_fetch_interval', '120', '미세먼지 데이터 수집 간격 (분)'),
('max_custom_reminders_per_recipient', '5', '수신자당 최대 맞춤 알림 수'),
('message_character_limit', '90', '메시지 글자 수 제한'),
('emergency_alert_timeout', '5', '긴급 알림 발송 제한 시간 (분)'),
('log_retention_days', '180', '로그 보관 기간 (일)');