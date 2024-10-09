-- health_check 테이블 생성 및 기본 데이터 삽입
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 상태 데이터를 삽입 (서비스가 정상 동작하는지 확인)
-- 촤소한의 health_check 데이터만 생성. 나머지는 TypeORM 마이그레이션으로 생성
INSERT INTO health_check (service_name, status) VALUES ('nestjs-server', 'healthy');

