# QueueFacade 통합테스트
이 테스트는 QueueFacade의 동시 요청 처리 및 대기열 위치 할당 기능을 검증합니다. 아래는 주요 내용입니다.

## 통합 테스트 범위
Facade - Service - Repository - Redis(test conatiner) - Postgres(test conatiner)

## 실행방법
```bash
npm run test src/application/facades/test/queue.facade.spec.ts   
```

## 테스트 환경 설정
- PostgreSQL 데이터베이스를 Docker 컨테이너로 시작하여 테스트 환경을 구성합니다.
- Redis 데이터베이스를 Docker 컨테이너로 시작하여 테스트 환경을 구성합니다.

## 검증 1
- 1000명이 동시에 대기열을 요청하면 서버는 토큰으로 응답합니다. 이때 이 토큰에 대기순서가 1 - 1000까지 중복되지않고 배분되었는지 확인합니다

## 검증 2
- 10초당 250명씩 활성화시킬 때, activeAt 시간이 잘 배분되었나 확인합니다. 테스트케이스에선 1000명이 요청하였기 때문에 10초당 4번 250명씩 균일하게 배분되어있어야합니다.

## 검증 3
- /queue/status 로 요청이 왔을 때 activeAt시간이 도래했다면 응답의 token status는 AVAILABLE로 되어있어야합니다

## 검증 4
- /queue/status 로 요청이 왔을 때 activeAt시간이 도래했다면 응답의 token status는 DISAVAILABLE로 되어있어야합니다


## 캐싱전략:
제 서비스에서 콘서트는 1가지 종류로 고정되어있습니다... 따라서 캐싱히트를 높이는데 어려움이 있다고 판단하여 대기열 개선에 집중했습니다...

