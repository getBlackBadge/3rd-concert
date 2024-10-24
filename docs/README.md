# 비즈니스 Usecase

# 콘서트 예약 서비스

이 문서는 콘서트 예약 서비스를 위한 유스케이스를 설명합니다. 사용자는 예약 가능한 좌석 정보를 조회하고, 대기 상태를 확인하며, 최종적으로 예약과 결제를 완료하는 과정을 포함합니다.

## 유스케이스 시나리오: 콘서트 예약

### 주요 액터
- 사용자

### 사전 조건
- 사용자는 콘서트 날짜를 알고 있어야 한다.
- 사용자는 유효한 JWT 토큰을 발급받아야 한다.

### 시나리오 흐름

1. **예약 가능한 좌석 수 조회**  
   - 사용자가 콘서트 날짜를 선택한 후, 해당 날짜에 예약 가능한 좌석 수를 조회하기 위해 `GET /reservations/:date` 요청을 보냅니다.
   - 시스템은 데이터베이스에서 해당 날짜의 예약 정보를 조회하여, 예약 가능한 좌석 수를 확인합니다.
   - 시스템은 사용자의 요청에 대한 응답으로 "예약 가능한 좌석 수: 75"라는 메시지를 반환합니다.

2. **토큰 발급**  
   - 사용자는 예약 절차를 진행하기 위해 신청 버튼을 클릭합니다. 이때 시스템에 `/queue/token` 요청을 보냅니다.
   - 시스템은 사용자의 요청을 처리하고, JWT 토큰을 생성합니다. 이 토큰은 5분 동안 유효합니다.
   - 시스템은 생성된 JWT 토큰을 사용자에게 응답합니다. 예를 들어, 응답 내용은 `{ "token": "eyJhbGciOiJIUzI1NiIsInR..." }` 형식입니다.

3. **대기 순서 확인**  
   - 사용자는 자신의 대기 상태를 확인하기 위해 `GET /queue/status` 요청을 보냅니다. 이때 헤더에는 발급받은 JWT 토큰을 포함합니다.
   - 시스템은 JWT 토큰을 검증하고, 사용자의 현재 대기 순서를 확인합니다.
   - 시스템은 응답으로 "현재 대기 순서: 5 / 총 대기자 수: 10"이라는 정보를 반환합니다.

4. **예약 가능한 좌석 정보 조회**  
   - 사용자의 대기 순서가 1번이 되면, 시스템은 자동으로 `GET /reservations/:date` 요청을 보냅니다.
   - 시스템은 해당 날짜에 예약 가능한 좌석 정보를 조회합니다.
   - 시스템은 예약 가능한 좌석 정보를 응답합니다. 예:
     ```json
     {
       "available_seats": [
         { "seat_number": "A1", "price": 100 },
         { "seat_number": "A2", "price": 100 }
       ]
     }
     ```

5. **예약 시도**  
   - 사용자는 응답받은 좌석 정보 중 하나를 선택하여 예약을 시도합니다. 예: 좌석 A1.
   - 사용자는 `POST /reservations` 요청을 보내며 선택한 좌석 정보와 함께 요청합니다.
   - 시스템은 예약 ID를 생성하고 사용자에게 응답합니다. 예: `{ "reservation_id": "12345" }`.

6. **결제 요청**  
   - 사용자는 예약 ID를 사용하여 결제를 진행합니다. `POST /payment` 요청을 보내며 예약 ID와 결제 정보를 포함합니다.
   - 시스템은 결제를 처리하고, 결제가 성공적으로 완료되면 예약을 확정합니다. 예: `{ "status": "success", "message": "예약이 완료되었습니다." }`.
   - 만약 결제가 실패한다면, 시스템은 사용자의 예약 상태를 스케줄러를 통해 5분 후에 확인하고, 예약이 만료될 경우 해당 예약을 취소합니다.

### 사후 조건
- 사용자가 결제를 성공적으로 완료하면 예약이 확정되며, 시스템은 예약 정보를 데이터베이스에 저장합니다.
- 사용자가 결제에 실패하면 예약은 만료되며, 다른 사용자가 해당 좌석을 예약할 수 있습니다.

### 예외 처리
- **대기 중 사용자 수 초과**: 새로운 사용자가 신청 버튼을 클릭할 때 대기 중인 사용자 수를 초과하면 해당 요청을 거부합니다.
- **결제 실패**: 결제 시 실패할 경우, 사용자는 재시도할 수 있으며, 자동으로 예약 상태를 갱신합니다.