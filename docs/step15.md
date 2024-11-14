# **STEP 15_기본**
나의 시나리오에서 수행하는 쿼리들을 수집해보고, 필요하다고 판단되는 인덱스를 추가하고 쿼리의 성능개선 정도를 작성하여 제출

## 1. 개요
- 데이터베이스의 인덱싱을 잘 활용하면 쿼리 성능을 높일 수 있습니다.
- 고려사항:
  - **한 번에 찾을 수 있는 값**: 데이터 중복이 적은 컬럼 → 높은 카디널리티
  - **인덱스 재정렬 최소화**: 데이터 삽입, 수정이 적은 컬럼
  - **인덱스의 목적은 검색**: 조회에 자주 사용되는 컬럼
  - **너무 많지 않은 인덱스**: 인덱스 또한 공간을 차지함

## 2. 쿼리 분석
- 자주 조회하는 쿼리 파악
- 코드를 분석해본 결과, 자주 쓰는 쿼리는 다음 3가지였습니다:
  - **SEAT**: `SELECT` where `concert_id`, `seatnumber`
  - **SEAT**: `SELECT` where `concert_id`, `status`
  - **CONCERT**: `SELECT` where `date`
- 복잡한 쿼리 분석:
  - 이외에 서비스에서 `JOIN` 등 복잡한 쿼리는 사용하지 않고 있습니다.

## 3. 인덱스 추가 및 성능 개선 비교

### 3-1. Case1 **SEAT**: `SELECT` where `concert_id`, `seatnumber`

- `concert_id` (10만개): `concert_id`는 고유한 값이 많고, 카디널리티가 높은 컬럼이므로 인덱싱을 추가하면 조회 성능이 향상됩니다.
- `seatnumber` (1~50): `seatnumber`는 범위가 좁고 카디널리티가 낮습니다. 이 컬럼은 여러 값이 중복될 수 있지만, `concert_id`와 함께 인덱스를 추가하면 더 빠른 검색이 가능합니다.
- **효과**: `concert_id`와 `seatnumber`를 복합 인덱스로 묶으면 대규모 데이터셋에서도 빠른 조회가 가능해집니다.


- **테스트**:
방법: 
- **인덱스 없을 때**
```bash
concert_service_db=# \d "Seats"
                                       Table "public.Seats"
   Column    |            Type             | Collation | Nullable |            Default
-------------+-----------------------------+-----------+----------+--------------------------------
 id          | uuid                        |           | not null | uuid_generate_v4()
 concert_id  | uuid                        |           | not null |
 seat_number | integer                     |           | not null |
 status      | character varying(20)       |           | not null | 'available'::character varying
 price       | integer                     |           | not null | 5000
 created_at  | timestamp without time zone |           | not null | now()
 updated_at  | timestamp without time zone |           | not null | now()
Indexes:
    "Seats_pkey" PRIMARY KEY, btree (id)
```
## 현재 인덱스 상태
- 현재 인덱스는 `PK`(Primary Key)에만 설정되어 있는 상태입니다.

## 테스트 환경
- **테스트 데이터**: `concert` 1만 개, `seat` 50만 개를 데이터베이스에 삽입합니다.
  
## 테스트 수행
- **테스트 절차**: 
  - `EXPLAIN ANALYZE`와 함께 10회 `INSERT` 후, 10회 `SELECT`를 실행합니다.
  - 매 요청 후 3초간 쉬어, 테스트 간의 영향을 최소화하고 독립적으로 실행합니다.
  
- **쿼리 실행 결과**:
(인덱스 없을 때)
Average INSERT Execution Time: 2.06 ms
Average SELECT Execution Time: 30.95 ms

- **인덱스 있을 때**
b tree 복합인덱스 추가
```bash
concert_service_db=# CREATE INDEX idx_concert_id_seat_number ON "Seats" (concert_id, seat_number);
CREATE INDEX
concert_service_db=# \d "Seats"
                                       Table "public.Seats"
   Column    |            Type             | Collation | Nullable |            Default
-------------+-----------------------------+-----------+----------+--------------------------------
 id          | uuid                        |           | not null | uuid_generate_v4()
 concert_id  | uuid                        |           | not null |
 seat_number | integer                     |           | not null |
 status      | character varying(20)       |           | not null | 'available'::character varying
 price       | integer                     |           | not null | 5000
 created_at  | timestamp without time zone |           | not null | now()
 updated_at  | timestamp without time zone |           | not null | now()
Indexes:
    "Seats_pkey" PRIMARY KEY, btree (id)
    "idx_concert_id_seat_number" btree (concert_id, seat_number)
```
다시 테스트
중간 로그만 봐도 
```bash
[
  {
    'QUERY PLAN': 'Index Scan using idx_concert_id_seat_number on "Seats"  (cost=0.42..8.44 rows=1 width=66) (actual time=0.063..0.066 rows=1 loops=1)'
  },
  {
    'QUERY PLAN': "  Index Cond: ((concert_id = 'b8e6f7ca-9845-42b9-9dd5-23aeef280533'::uuid) AND (seat_number = 4))"
  },
  { 'QUERY PLAN': 'Planning Time: 0.220 ms' },
  { 'QUERY PLAN': 'Execution Time: 0.128 ms' }
]
```
Index Scan 을 하고있는 것을 볼 수 있다.

**같은 조건으로 10회 테스트 후 평균 결과**
Average INSERT Execution Time: 1.39 ms
Average SELECT Execution Time: 0.16 ms

### Case2 3-2. SEAT: - SELECT where concert_id, status

기대 효과: concert_id와 status를 복합 인덱스로 추가하면, 상태별로 좌석을 조회하는 성능이 개선된다.

```bash
concert_service_db=# DROP INDEX idx_concert_id_seat_number;
DROP INDEX

Indexes:
    "Seats_pkey" PRIMARY KEY, btree (id)
```
같은 조건으로 테스트해봤다.
- **테스트 결과**:
  - **인덱스 없을 때**
    - Average INSERT Execution Time: 1.31 ms
    - Average SELECT Execution Time: 26.82 ms

  - **인덱스 있을 때**
  ```bash
  "idx_concert_id_seat_number" btree (concert_id, status)
  ```
    - Average INSERT Execution Time: 1.91 ms
    - Average SELECT Execution Time: 0.20 ms


### 3-3. Case3 CONCERT: `SELECT` where `concert_date`

- **테스트 환경**: 이번에는 `concert` 50만 개를 미리 데이터베이스에 삽입해놓은 상태에서 테스트를 진행했습니다.
  
- **기대효과**: 날짜 기반의 조회가 많으므로, 인덱스를 추가하면 쿼리 성능이 크게 개선됩니다.

- **테스트 결과**:

  - **인덱스 없을 때**
    - Average INSERT Execution Time: 0.40 ms
    - Average SELECT Execution Time: 28.90 ms
  
  - **인덱스 있을 때**
    - Average INSERT Execution Time: 0.44 ms
    - Average SELECT Execution Time: 0.20 ms


## 4. 결론
- **Case1 SEAT**: `SELECT` where `concert_id`, `seatnumber`
  - `concert_id`, `seatnumber`를 복합 인덱스로 만들었을 때, 성능 저하가 `INSERT`는 큰 차이가 없었지만 `SELECT`에서 30.95 ms ->  0.16 ms 로 유의미한 성능 향상을 보였습니다.
  - 다만 2번 케이스인 `concert_id`, `status`의 복합 인덱스와 겹치는 부분이 있습니다.
- **Case2 SEAT**: `SELECT` where `concert_id`, `status`
  - 마찬가지로 성능 저하가 `INSERT`는 큰 차이가 없었지만 `SELECT`에서 26.82 ms ->  0.20 ms 로 유의미한 성능 향상을 보였습니다. 
  - 서비스 로직 상 해당 콘서트에 'available' 한 좌석을 구하는 쿼리를 seatnumber 보다 많이 날립니다. (예비 소비자(Case2) + 실제 소비자(Case2, Case1)) > (실제 소비자 (Case2, Case1)).
  - 따라서 Case2의 인덱싱만 실제 서비스로 적용하고 Case1은 사용하지 않았습니다.
- **Case3 CONCERT**: `SELECT` where `date`
  - `SELECT`에서 28.90 ms ->  0.20 ms 로 마찬가지로 좋은 성능 향상을 보였습니다. 하지만 GET /concert 요청상 멱등성을 가지므로 캐시로 처리하는 것이 좋다고 판단해서 실제 서비스로 적용하진 않았습니다.
- **총합**:
  - 처음 인덱싱을 해보고 테스트를 했는데 효과가 매우 커서 놀랐습니다. 
  - 하지만 결국은 등가교환인 선택같습니다. 그나마 B tree라 나았지 다른 인덱싱을 사용했다면 insert 성능이 눈에 띄게 저하되었을 수도 있습니다. 또한 인덱싱을 저장하는 것 또한 저장공간을 사용하는 것입니다. 
  - 따라서 무조건 속도를 쫓기보다는 효율적인 곳에 합리적인 근거를 가지고 선택하는 것이 바람직해보입니다.

### Case4 (보너스) uuid4 vs uuid7

- 인덱스를 추가한 것이 아니기 때문에 이번 과제에는 포함되지 않지만, 관련이 있어 재미있는 내용을 추가해 보았습니다. 
- 대부분의 데이터베이스에서는 기본 키(primary key)에 인덱싱을 진행하는데, MySQL은 B+Tree, PostgreSQL은 B-Tree를 사용합니다.

#### postgres 데이터베이스 테이블 구조 예시

```bash
concert_service_db=# \d "Concerts"
                                      Table "public.Concerts"
         Column                |             Type             | Collation | Nullable |      Default
------------------------------+-----------------------------+-----------+----------+--------------------
 id                           | uuid                        |           | not null | uuid_generate_v4()
 name                         | character varying(255)      |           | not null |
 venue                        | character varying(255)      |           | not null |
 concert_date                 | date                        |           | not null |
 max_seats                    | integer                     |           | not null | 50
 created_at                   | timestamp without time zone |           | not null | now()
 updated_at                   | timestamp without time zone |           | not null | now()
 reservation_start_time       | timestamp without time zone |           | not null |
Indexes:
    "Concerts_pkey" PRIMARY KEY, btree (id)
```


MSA 환경에서 id를 uuid로 사용하는 것은 장점이 많기 때문에 흔한 일입니다.
그런데 최근에 알게 된 흥미로운 사실은, 이런 조건에서 uuid7이 uuid4보다 기본 키로 더 빠를 수 있다는 주장이었습니다. [uuid7.com](https://uuid7.com) 에서는 uuid7이 더 좋다고 주장하며, 그 이유를 설명합니다. 그 중 하나는 PK에 대한 B-Tree 인덱싱 시 정렬 방식입니다.

B-Tree는 리프 노드가 최대 개수를 초과하면 쪼개지는 방식으로 작동하는데, 이때 삽입되는 값들이 무작위로 들어가면 쪼개는 횟수가 늘어납니다. 예를 들어, uuid4는 값이 완전 랜덤이기 때문에 노드 중간중간에 삽입됩니다. 반면 uuid7은 처음 두 블록이 `타임스탬프`이기 때문에 순차적으로 삽입됩니다.

예시: uuid7 생성 순차성
다음은 방금 생성한 3개의 uuid7입니다.
```bash
01932b88-92bd-7001-91c7-47d90c7fa1f2  
01932b89-3b08-739b-aef3-19cee872aa07  
01932b89-7325-76d0-a103-17737359dc54
````

이 중에서 `01932b88-92bd`, `01932b89-3b08`, `01932b89-7325` 부분은 타임스탬프이며, 값이 문자열이지만 정렬 순으로 봐도 순차적으로 증가하는 모습을 확인할 수 있습니다. 따라서 리프 노드에 추가될 때도 오른쪽에 순차적으로 배치되어, 트리의 리프 노드가 최대 개수를 초과하는 경우가 줄어들기 때문에 정렬 시간이 줄어들 수 있어 `insert` 시 장점이 있다고 합니다.

#### 실험 결과

`uuid4`와 `uuid7`을 비교하는 테스트를 진행했습니다.

##### uuid4 테스트

10만 개의 `Concert` 데이터를 `uuid4`로 추가하고, 10번의 3초 간격으로 `uuid4`를 삽입한 후 같은 아이디를 `select`한 결과:

- Average INSERT Execution Time: 0.78 ms  
- Average SELECT Execution Time: 0.20 ms

##### uuid7 테스트

10만 개의 `Concert` 데이터를 `uuid7`로 추가하고, 10번의 3초 간격으로 `uuid7`을 삽입한 후 같은 아이디를 `select`한 결과:

1회 실행:

- Average INSERT Execution Time: 0.27 ms  
- Average SELECT Execution Time: 0.19 ms

신기해서 한번 더 해봤습니다

2회 실행:

- Average INSERT Execution Time: 0.49 ms  
- Average SELECT Execution Time: 0.23 ms

실제로 INSERT가 0.78 vs 0.27, 0.49로 미묘하게 줄은 듯한 모습입니다.

그러나 `uuid7`이 빠른 결과를 만들었지만, 구글링을 통해 확인한 바로는 `uuid7`에 대한 논란도 많습니다. 

그 이유 중 하나는 `uuid7`의 앞부분이 타임스탬프이기 때문에 보안상 취약할 수 있다는 점입니다. 

예를 들어, `01932b89-7325-76d0-a103-17737359dc54` 라는 `uuid7`을 보면 언제 이 ID가 생성된 것인지 알 수 있습니다. 이를 통해 지금 글의 생성 시기를 `uuid`를 통해 알 수 있는 것입니다. 만약 이 아이디가 진료 기록 등에 사용될 경우, 사용자가 원하지 않아도 진료 기록의 생성 시점을 추론할 수 있게 됩니다. 따라서 보안이 중요한 곳에서는 적합하지 않을 수 있습니다.

#### 결론

저는 이것이 선택의 문제라고 생각합니다. 시간에 민감하지 않은 곳에서는 `uuid7`을 사용할 수 있으며, 서비스의 요구에 따라 선택해야 할 것입니다. `uuid`에 대해 새롭게 배우고, B-Tree의 정렬 방식에 대해서도 알게 되어 매우 의미 있고 재미있는 발견이었습니다.
