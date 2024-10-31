# RedisWaitLockManager 작동 원리

### 1. 락 요청
   - `withLockBySrc` 메서드가 자원에 대한 고유한 락 키와 대기열 키를 생성하고, 요청 ID를 발급합니다.

### 2. 대기열 등록
   - 현재 요청을 Redis 대기열에 추가합니다. redis sorted set을 사용해 타임스탬프를 기준으로 대기열을 구성합니다.

### 3. 차례 대기
   - 대기열 맨 앞에 올 때까지 기다리거나, 차례가 되면 subscribe된 Redis 채널에서 알림을 받습니다.

### 4. 락 획득
   - 락을 시도하여 성공 시 일정 시간(TTL) 동안 자원을 잠급니다.

### 5. 작업 수행
   - 락을 획득한 상태에서 지정된 작업을 실행합니다.

### 6. 락 해제 및 대기열에서 제거
   - 작업 완료 후 락을 해제하고 대기열에서 본인을 삭제합니다.

### 7. 다음 요청 알림
   - 대기열의 다음 요청이 있으면, 다음 대상을 확인 후 Redis 채널을 통해 publish로 메세지를 보냅니다.


# **분산 락 통합 테스트 작성**

## 통합 테스트 범위
Facade - Service - Repository - Redis(test conatiner) - Postgres(test conatiner)

# 첫 번째 테스트: QueueFacade
이 테스트는 QueueFacade의 동시 요청 처리 및 대기열 위치 할당 기능을 검증합니다. 아래는 주요 내용입니다.

## 실행방법
```bash
npm run test src/application/facades/test/queue.facade.spec.ts   
```

## 테스트 환경 설정
- PostgreSQL 데이터베이스를 Docker 컨테이너로 시작하여 테스트 환경을 구성합니다.
- Redis 데이터베이스를 Docker 컨테이너로 시작하여 테스트 환경을 구성합니다.

## 동시 요청 처리
- 100명의 사용자가 `createToken` 메서드를 동시에 호출하여 대기열 위치를 할당합니다.
- 서버는 redis를 통해 concertId를 기준으로 베타락을 걸고 순차적으로 처리합니다
- 각 호출 결과로 반환된 토큰에서 대기열 위치를 디코드하고, 모든 요청이 서로 다른 대기열 위치를 할당받았는지 확인합니다.

# 두 번째 테스트: BalanceFacade
이 테스트는 BalanceFacade의 포인트 충전 및 사용 기능의 동시성 처리를 검증합니다. 주요 내용은 다음과 같습니다.

## 실행방법
```bash
npm run test src/application/facades/test/balance.facade.spec.ts   
```

## 테스트 환경 설정
- 첫 번째 테스트와 마찬가지로 PostgreSQL, Redis 데이터베이스를 Docker 컨테이너로 시작하여 환경을 설정합니다.

## 포인트 충전 및 사용 요청
- `balanceFacade`를 사용하여 특정 사용자에게 50 포인트를 충전합니다.
- 그 후, 해당 사용자에게 1 포인트를 사용하는 요청을 70번 동시에 발생시킵니다.

## 검증
- 모든 사용 요청이 완료된 후 성공과 실패 횟수를 계산합니다.
- 잔액은 50원밖에 없기 때문에 무조건 20번은 실패해야합니다.
- 충전된 포인트에 대한 사용 요청이 처리되어 50번은 성공하고 20번은 실패하는지 검증하여 동시성 처리가 올바르게 이루어졌는지를 확인합니다.


# 세 번째 테스트: ReservationFacade
이 테스트는 ReservationFacade의 좌석 예약의 동시성 처리를 검증합니다. 주요 내용은 다음과 같습니다.

## 실행방법
```bash
npm run test src/application/facades/test/reservation.facade.spec.ts   
```

## 테스트 환경 설정
- 첫 번째 테스트와 마찬가지로 PostgreSQL, Redis 데이터베이스를 Docker 컨테이너로 시작하여 환경을 설정합니다.

## 동일 콘서트 동일 좌석 예약 요청
- 동시에 10회를 요청한다.
- 9회는 실패하고 1회만 성공해야한다

## 검증
- 모든 요청의 결과를 조회합니다.
- 성공 케이스가 1회인지 확인합니다.
- 실패 케이스가 9회인지 확인합니다.

### 추가 lock 테스트 코드는 'src/application/facades/test' 에 있습니다