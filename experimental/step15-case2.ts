import { Client } from 'pg';

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'concert_service_db',
  password: 'password',
  port: 5432,
});

async function insertAndSelectSeats(concertId: string) {
  let insertExecutionTimes: number[] = [];
  let selectExecutionTimes: number[] = [];

  await client.connect();

  // INSERT 10회
  for (let i = 1; i <= 10; i++) {
    const insertQuery = `
      EXPLAIN ANALYZE INSERT INTO "Seats" 
      ("concert_id", "seat_number", "status", "created_at", "updated_at", "price")
      VALUES ($1, $2, 'available', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 500);
    `;
    
    const insertRes = await client.query(insertQuery, [concertId, i]);
    console.log(`Insertion ${i} result:`, insertRes.rows);

    const insertTimeRow = insertRes.rows.find(row => row['QUERY PLAN'].includes('Execution Time'));
    if (insertTimeRow) {
      const insertTime = parseFloat(insertTimeRow['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/)[1]);
      insertExecutionTimes.push(insertTime);
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
  }

  // SELECT 10회
  for (let i = 1; i <= 10; i++) {
    const selectQuery = `
      EXPLAIN ANALYZE SELECT * FROM "Seats" WHERE "concert_id" = $1 AND "status" = 'available';
    `;
    
    const selectRes = await client.query(selectQuery, [concertId]);
    console.log(`Selection ${i} result:`, selectRes.rows);

    const selectTimeRow = selectRes.rows.find(row => row['QUERY PLAN'].includes('Execution Time'));
    if (selectTimeRow) {
      const selectTime = parseFloat(selectTimeRow['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/)[1]);
      selectExecutionTimes.push(selectTime);
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
  }

  // 실행 시간 평균 계산
  const avgInsertTime = insertExecutionTimes.reduce((sum, time) => sum + time, 0) / insertExecutionTimes.length;
  const avgSelectTime = selectExecutionTimes.reduce((sum, time) => sum + time, 0) / selectExecutionTimes.length;

  console.log(`Average INSERT Execution Time: ${avgInsertTime.toFixed(2)} ms`);
  console.log(`Average SELECT Execution Time: ${avgSelectTime.toFixed(2)} ms`);

  // INSERT된 행 삭제
  const deleteQuery = `DELETE FROM "Seats" WHERE "concert_id" = $1;`;
  const deleteRes = await client.query(deleteQuery, [concertId]);
  console.log(`Deleted ${deleteRes.rowCount} rows from Seats table with concert_id = ${concertId}`);  
  await client.end();
} 
  

const concertId = 'b8e6f7ca-9845-42b9-9dd5-23aeef280533'; // 적절한 concert_id 값으로 교체
insertAndSelectSeats(concertId);
