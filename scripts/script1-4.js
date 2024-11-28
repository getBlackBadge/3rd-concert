import http from 'k6/http';

export let options = {};

// Peak Test
export const peakTestOptions = {
  stages: [
    { duration: '10s', target: 1000 }, // 최고 부하를 단기간에 도달
    { duration: '20s', target: 0 },    // 부하 완화
  ],
};

options = peakTestOptions; // Peak Test 실행 시 활성화

// 요청 시나리오
export default function () {
  http.get('http://host.docker.internal:3001/reservations/2024-11-24');
}
