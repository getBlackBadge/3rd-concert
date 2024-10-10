# 1. ERD 설계 자료

## 개요
이 ERD는 사용자, 콘서트, 좌석 예약 및 결제 시스템을 설계합니다. 각 테이블은 사용자의 콘서트 예약 및 결제 과정을 명확하게 정의하며, 좌석 상태 관리 및 대기열 처리 기능도 포함하고 있습니다. 데이터 무결성을 위해 다양한 제약 조건을 설정하여 중복을 방지하고 시스템의 효율성을 높였습니다.

콘서트 예약 가능 여부를 따지기 위해서는 `Concerts`, `Seats`, `Reservations` 이 세 테이블을 모두 확인해야하는 성능상의 문제가 존재했었습니다.
이를 개선하기 위해서 `Concerts`테이블과 `Seats`의 status 필드를 활용해 예약 가능여부를 확인하는 것으로 변경하고
`Reservations` 테이블은 결제에 필요한 정보, 만료 처리에 필요한 정보를 담는 것으로 분리했습니다.

## Users 테이블

| 컬럼명       | 타입              | 제약조건                        | 설명             |
|--------------|-------------------|---------------------------------|------------------|
| `id`         | UUID              | Primary Key                     | 사용자 고유 식별자 |
| `username`   | VARCHAR(255)       | NOT NULL                        | 사용자 이름       |
| `email`      | VARCHAR(255)       | UNIQUE, NOT NULL                | 사용자 이메일     |
| `balance`    | DECIMAL(10, 2)     | DEFAULT 0.00                    | 사용자 잔액       |
| `created_at` | TIMESTAMP          | DEFAULT CURRENT_TIMESTAMP       | 생성일           |
| `updated_at` | TIMESTAMP          | DEFAULT CURRENT_TIMESTAMP       | 수정일           |

## Concerts 테이블

| 컬럼명        | 타입              | 제약조건                        | 설명             |
|---------------|-------------------|---------------------------------|------------------|
| `id`          | UUID              | Primary Key                     | 콘서트 고유 식별자 |
| `name`        | VARCHAR(255)       | NOT NULL                        | 콘서트 이름       |
| `venue`       | VARCHAR(255)       | NOT NULL                        | 콘서트 장소       |
| `concert_date`| DATE              | NOT NULL                        | 콘서트 날짜       |
| `created_at`  | TIMESTAMP          | DEFAULT CURRENT_TIMESTAMP       | 생성일           |
| `updated_at`  | TIMESTAMP          | DEFAULT CURRENT_TIMESTAMP       | 수정일           |

## Seats 테이블

| 컬럼명        | 타입              | 제약조건                                             | 설명                 |
|---------------|-------------------|-----------------------------------------------------|----------------------|
| `id`          | UUID              | Primary Key                                         | 좌석 고유 식별자      |
| `concert_id`  | UUID              | REFERENCES Concerts(id)                             | 콘서트 ID             |
| `seat_number` | INT               | NOT NULL, CHECK (seat_number >= 1 AND seat_number <= 50) | 좌석 번호            |
| `status`      | VARCHAR(20)       | DEFAULT 'available'                                 | 좌석 상태 (available, reserved_temp, reserved_final) |
| `created_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP                           | 생성일               |
| `updated_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP                           | 수정일               |
| **제약조건**  |                   | UNIQUE (concert_id, seat_number)                    | 좌석 번호는 콘서트당 고유 |

## Queue 테이블

| 컬럼명        | 타입              | 제약조건                          | 설명               |
|---------------|-------------------|-----------------------------------|--------------------|
| `id`          | UUID              | Primary Key                       | 대기열 고유 식별자   |
| `user_id`     | UUID              | REFERENCES Users(id)              | 사용자 ID           |
| `concert_id`  | UUID              | REFERENCES Concerts(id)           | 콘서트 ID           |
| `queue_position` | INT            | NOT NULL                          | 대기 순서           |
| `wait_time`   | VARCHAR(50)       |                                   | 예상 대기 시간       |
| `token`       | VARCHAR(255)      | UNIQUE                            | JWT 토큰           |
| `created_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP         | 생성일             |
| `updated_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP         | 수정일             |
| **제약조건**  |                   | UNIQUE (user_id, concert_id)       | 사용자는 한 콘서트당 하나의 대기열만 가질 수 있음 |

## Reservations 테이블

| 컬럼명        | 타입              | 제약조건                          | 설명              |
|---------------|-------------------|-----------------------------------|-------------------|
| `id`          | UUID              | Primary Key                       | 예약 고유 식별자    |
| `user_id`     | UUID              | REFERENCES Users(id)              | 사용자 ID          |
| `concert_id`  | UUID              | REFERENCES Concerts(id)           | 콘서트 ID          |
| `seat_id`     | UUID              | REFERENCES Seats(id) UNIQUE       | 좌석 ID            |
| `status`      | VARCHAR(20)       | DEFAULT 'pending'                 | 예약 상태 (pending, completed, canceled) |
| `amount`      | DECIMAL(10, 2)    | NOT NULL                          | 결제 금액          |
| `reserved_at` | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP         | 예약 시간          |
| `payment_deadline` | TIMESTAMP    |                                   | 결제 마감 시간      |
| `completed_at` | TIMESTAMP        |                                   | 완료 시간          |
| `created_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP         | 생성일            |
| `updated_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP         | 수정일            |

## Payments 테이블

| 컬럼명        | 타입              | 제약조건                          | 설명              |
|---------------|-------------------|-----------------------------------|-------------------|
| `id`          | UUID              | Primary Key                       | 결제 고유 식별자    |
| `reservation_id` | UUID           | REFERENCES Reservations(id)       | 예약 ID           |
| `user_id`     | UUID              | REFERENCES Users(id)              | 사용자 ID          |
| `amount`      | DECIMAL(10, 2)    | NOT NULL                          | 결제 금액          |
| `payment_status` | VARCHAR(20)    | DEFAULT 'pending'                 | 결제 상태 (pending, success, failed) |
| `payment_method` | VARCHAR(50)    | NOT NULL                          | 결제 방법 (예: credit_card, **페이) |
| `created_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP         | 생성일            |
| `updated_at`  | TIMESTAMP         | DEFAULT CURRENT_TIMESTAMP         | 수정일            |

# 2. API 명세
[api-spec.yaml에서 자세한 내용을 보실 수 있습니다.]

### 콘서트 예약 서비스 API 요약

- **GET /health**: 서비스 상태 확인 (OK/ERROR)
- **POST /auth/login**: 사용자 로그인, JWT 토큰 발급
- **POST /queue/token**: 콘서트 대기열 참여, 토큰 발급
- **GET /concerts**: 예약 가능한 콘서트 목록 조회
- **GET /concerts/{id}/seats**: 특정 콘서트 좌석 정보 조회
- **POST /reservation**: 좌석 예약 요청, 임시 홀딩
- **GET /balance**: 사용자 잔액 조회
- **POST /balance**: 사용자 잔액 충전
- **POST /payment**: 좌석 예약 결제 완료

# 3. Mock API
## 요약:
- openapi 문서를 mock server로 만들어주는 npm 라이브러리 prism을 사용했습니다.
### How to start
- 직접 실행하는 법:
  ```bash
  chmod +x ./run-mock-server.sh
  ./run-mock-server.sh
    ```
- nginx와 함께 실행하는 법:
  ```bash
    docker compose up
    ```