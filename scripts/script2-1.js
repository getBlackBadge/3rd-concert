import http from 'k6/http';
import { check } from 'k6';

// 테스트 설정 (옵션을 사용해 테스트 유형 선택)
export let options = {};

// Load Test
export const loadTestOptions = {
  vus: 100, // 예상 부하 수준
  duration: '1m', // 1분 동안 지속
};

// 실행할 테스트 유형 선택
options = loadTestOptions; // Load Test 실행 시 활성화

// 대기열 신청 테스트 시나리오
export default function () {
  const url = 'http://host.docker.internal:3001/queue/token';

  // 요청에 보낼 데이터
  const payload = JSON.stringify({
    userId: "1bc25754-fe18-47b1-bc9f-1b785fb46822", // 예시 유저 ID
    concertId: '0193736b-34f6-7998-ad0e-11ac09643923', // 예시 콘서트 ID
  });

  // 요청 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
  };

  // POST 요청 보내기
  const response = http.post(url, payload, { headers });

}
