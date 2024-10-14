## 1. 시나리오 선정 
 - 콘서트 예약 서비스
 - 이유: 대기열 생성, 좌석 예약, 결제 등 다양한 기능이 학습하기에 매우 좋아보였다.

## 2. 프로젝트 마일스톤
    마일스톤 깃허브로 만들었기에 깃허브 링크로 제출합니다.
    https://github.com/users/getBlackBadge/projects/1

## 3. 요구사항 분석 자료
### 요약
- 대기열은 queue테이블에 저장한다
- 예약을 하면 reservation테이블에 만료시간과 좌석 등 결제시 필요한 정보를 저장하고 seat테이블의 status를 업데이트한다
- reservation테이블에 row를 추가할 때, nest cronjob으로 5분 뒤 해당 id를 조회하고 상태를 확인한다. 만료 시간이 지났나면 해당 예약을 무효화한다.
- reservation_id를 가지고 결제를 진행한다. 

### 시퀀스 다이어그램
### 1. mock-server
    nginx에서 /mock로 시작하는 요청은 MockServer로 전송한다
```mermaid
sequenceDiagram
    participant User
    participant Nginx
    participant MockServer as MockServer(prism)
    participant NestJs

    User ->> Nginx: 요청 전송 (/mock 또는 다른 경로)
    alt URL이 /mock으로 시작
        Nginx ->> MockServer: 요청 전달 (/mock/*)
        MockServer -->> Nginx: 응답
    else 이외 나머지 경로
        Nginx ->> NestJs: 요청 전달 (기타 경로)
        NestJs -->> Nginx: 응답
    end
    Nginx -->> User: 응답 전송
```
### 2. 콘서트 목록 확인
```mermaid
sequenceDiagram
    actor User as UI
    participant NestJS
    participant Postgres

    %% 1. 유저가 예약 가능한 콘서트 목록 요청
    User ->> NestJS: GET /concerts
    NestJS ->> Postgres: 예약 가능한 콘서트 목록 조회
    Postgres -->> NestJS: 콘서트 목록 및 남은 좌석 수 반환
    NestJS -->> User: 콘서트 목록 및 남은 좌석 수 응답
```

### 3. 대기열 등록
```mermaid
sequenceDiagram
    actor User as UI
    participant NestJS
    participant Postgres

    %% 1. 유저가 대기열 등록 요청
    User ->> NestJS: POST /queue/token (concert_id, user_id)
    NestJS ->> Postgres: 대기열 등록 (Queue 테이블)
    Postgres -->> NestJS: 대기열 등록 완료
    NestJS -->> User: 대기열 등록 완료 응답
```

### 4. 좌석 예약
```mermaid
sequenceDiagram
    actor User as UI
    participant NestJS
    participant Postgres
    participant NestJS(CronJob)

    %% 1. 유저가 대기열 등록 요청
    User ->> NestJS: POST /queue/token (concert_id, user_id)
    NestJS ->> Postgres: 대기열 등록 (Queue 테이블)
    Postgres -->> NestJS: 대기열 등록 완료
    NestJS -->> User: 대기열 등록 완료 응답

    %% 2. 유저가 자기 순서 확인 요청
    User ->> NestJS: GET /queue/status (user_id)
    NestJS ->> Postgres: 대기열 순서 조회
    Postgres -->> NestJS: 대기열 순서 반환
    NestJS -->> User: 대기열 순서 응답

    %% 3. 유저가 예약 가능한 좌석 요청
    User ->> NestJS: GET /concerts/{concert_id}/seats
    NestJS ->> Postgres: 예약 가능한 좌석 정보 조회
    Postgres -->> NestJS: 예약 가능 좌석 정보 반환
    NestJS -->> User: 예약 가능 좌석 정보 응답

    %% 4. 유저가 특정 좌석으로 예약 요청
    User ->> NestJS: POST /reservation (concert_id, user_id, seat_id)
    NestJS ->> Postgres: 좌석 상태를 'reserved_temp'로 변경 (Seats 테이블)
    NestJS ->> Postgres: 예약 정보 생성 (Reservations 테이블, 상태: pending, 결제 마감 시간: +5분)
    Postgres -->> NestJS: 좌석 상태 및 예약 정보 업데이트 완료
    NestJS -->> User: 임시 예약 완료, 결제 정보 요청

    %% 5. 예약 상태 확인 및 변경 (콜백 형태로 처리)
    loop 5분 후
        NestJS(CronJob) ->> Postgres: 예약 상태 확인 (예약_id)
        Postgres -->> NestJS(CronJob): 예약 정보 반환
        alt 예약 상태가 'pending'
            NestJS(CronJob) ->> Postgres: 예약 상태를 'canceled'로 업데이트 (Reservations 테이블)
            NestJS(CronJob) ->> Postgres: 좌석 상태를 'available'로 변경 (Seats 테이블)
            Postgres -->> NestJS(CronJob): 좌석 및 예약 상태 업데이트 완료
        else 예약 상태가 'completed'
            %% 예약이 완료된 경우 아무 동작도 하지 않음
        end
    end
```

### 5. 결제
```mermaid
sequenceDiagram
    actor User as UI
    participant NestJS
    participant Postgres

    %% 1. 유저가 결제 요청
    User ->> NestJS: POST /payment (reservation_id, payment_method)
    NestJS ->> Postgres: 결제 정보 생성 (Payments 테이블)
    Postgres -->> NestJS: 결제 정보 저장 완료

    %% 2. 예약 상태 업데이트
    NestJS ->> Postgres: 예약 상태를 'completed'로 업데이트 (Reservations 테이블)
    NestJS ->> Postgres: 좌석 상태를 'reserved_final'로 변경 (Seats 테이블)
    Postgres -->> NestJS: 좌석 상태 및 예약 상태 업데이트 완료
    NestJS -->> User: 결제 완료 및 예약 확정
```

### 6. 전체
```mermaid
sequenceDiagram
    participant User
    participant Nginx
    participant MockServer(prism)
    participant NestJS
    participant Postgres
    participant NestJS(CronJob)

    %% 1. Mock Server 요청 처리
    User ->> Nginx: 요청 전송 (/mock 또는 다른 경로)
    alt URL이 /mock으로 시작
        Nginx ->> MockServer: 요청 전달 (/mock/*)
        MockServer -->> Nginx: 응답
    else 이외 나머지 경로
        Nginx ->> NestJS: 요청 전달 (기타 경로)
        NestJS -->> Nginx: 응답
    end
    Nginx -->> User: 응답 전송

    %% 2. 유저가 예약 가능한 콘서트 목록 요청
    User ->> NestJS: GET /concerts
    NestJS ->> Postgres: 예약 가능한 콘서트 목록 조회
    Postgres -->> NestJS: 콘서트 목록 및 남은 좌석 수 반환
    NestJS -->> User: 콘서트 목록 및 남은 좌석 수 응답

    %% 3. 유저가 대기열 등록 요청
    User ->> NestJS: POST /queue/token (concert_id, user_id)
    NestJS ->> Postgres: 대기열 등록 (Queue 테이블)
    Postgres -->> NestJS: 대기열 등록 완료
    NestJS -->> User: 대기열 등록 완료 응답

    %% 4. 유저가 자기 순서 확인 요청
    User ->> NestJS: GET /queue/status (user_id)
    NestJS ->> Postgres: 대기열 순서 조회
    Postgres -->> NestJS: 대기열 순서 반환
    NestJS -->> User: 대기열 순서 응답

    %% 5. 유저가 예약 가능한 좌석 요청
    User ->> NestJS: GET /concerts/{concert_id}/seats
    NestJS ->> Postgres: 예약 가능한 좌석 정보 조회
    Postgres -->> NestJS: 예약 가능 좌석 정보 반환
    NestJS -->> User: 예약 가능 좌석 정보 응답

    %% 6. 유저가 특정 좌석으로 예약 요청
    User ->> NestJS: POST /reservation (concert_id, user_id, seat_id)
    NestJS ->> Postgres: 좌석 상태를 'reserved_temp'로 변경 (Seats 테이블)
    NestJS ->> Postgres: 예약 정보 생성 (Reservations 테이블, 상태: pending, 결제 마감 시간: +5분)
    Postgres -->> NestJS: 좌석 상태 및 예약 정보 업데이트 완료
    NestJS -->> User: 임시 예약 완료, 결제 정보 요청

    %% 7. 예약 상태 확인 및 변경 (콜백 형태로 처리)
    loop 5분 후
        NestJS(CronJob) ->> Postgres: 예약 상태 확인 (예약_id)
        Postgres -->> NestJS(CronJob): 예약 정보 반환
        alt 예약 상태가 'pending'
            NestJS(CronJob) ->> Postgres: 예약 상태를 'canceled'로 업데이트 (Reservations 테이블)
            NestJS(CronJob) ->> Postgres: 좌석 상태를 'available'로 변경 (Seats 테이블)
            Postgres -->> NestJS(CronJob): 좌석 및 예약 상태 업데이트 완료
        else 예약 상태가 'completed'
            %% 예약이 완료된 경우 아무 동작도 하지 않음
        end
    end

    %% 8. 유저가 결제 요청
    User ->> NestJS: POST /payment (reservation_id, payment_method)
    NestJS ->> Postgres: 결제 정보 생성 (Payments 테이블)
    Postgres -->> NestJS: 결제 정보 저장 완료

    %% 9. 예약 상태 업데이트
    NestJS ->> Postgres: 예약 상태를 'completed'로 업데이트 (Reservations 테이블)
    NestJS ->> Postgres: 좌석 상태를 'reserved_final'로 변경 (Seats 테이블)
    Postgres -->> NestJS: 좌석 상태 및 예약 상태 업데이트 완료
    NestJS -->> User: 결제 완료 및 예약 확정
```
