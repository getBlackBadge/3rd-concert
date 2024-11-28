import http from 'k6/http';

export let options = {};


// Endurance Test
export const enduranceTestOptions = {
  vus: 50, // 장기간 동안 유지할 부하
  duration: '3m', // 3분 동안 지속
};

options = enduranceTestOptions; // Endurance Test 실행 시 활성화

// 요청 시나리오
export default function () {
  http.get('http://host.docker.internal:3001/reservations/2024-11-24');
}
