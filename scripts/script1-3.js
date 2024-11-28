import http from 'k6/http';

export let options = {};


// Stress Test
export const stressTestOptions = {
  stages: [
    { duration: '1m', target: 50 },  // 점진적으로 부하 증가
    { duration: '1m', target: 100 }, // 부하 추가 증가
    { duration: '1m', target: 150 }, // 최대 부하 도달
    { duration: '1m', target: 200 }, // 고부하 유지c
    { duration: '1m', target: 0 },   // 부하 감소
  ],
};

options = stressTestOptions; // Stress Test 실행 시 활성화
// 요청 시나리오
export default function () {
  http.get('http://host.docker.internal:3001/reservations/2024-11-24');
}
