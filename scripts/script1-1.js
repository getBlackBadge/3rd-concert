import http from 'k6/http';

export let options = {};

// Load Test
export const loadTestOptions = {
  vus: 100, // 예상 부하 수준
  duration: '1m', // 1분 동안 지속
};

options = loadTestOptions; // Load Test 실행 시 활성화

export default function () {
  http.get('http://host.docker.internal:3001/reservations/2024-11-24');
}
