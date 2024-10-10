1. 시나리오 선정 
 - 콘서트 예약 서비스
 - 이유: 대기열 생성, 좌석 예약, 결제 등 다양한 기능이 학습하기에 매우 좋아보였다.

2. 프로젝트 마일스톤
    마일스톤 깃허브로 만들었기에 깃허브 링크로 제출합니다.
    https://github.com/users/getBlackBadge/projects/1

3. 요구사항 분석 자료
    시퀀스 다이어그램
    1. mock-server
    nginx에서 /mock로 시작하는 요청은 MockServer로 전송한다
    ```mermaid
    sequenceDiagram
    participant User
    participant Nginx
    participant MockServer(prism)
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
    2. 대기열
    3. 좌석 예약
    4. 결제