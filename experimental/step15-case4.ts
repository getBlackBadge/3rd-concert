import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';  // Importing uuidv4
import { v7 as uuidv7 } from 'uuid';

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'concert_service_db',
  password: 'password',
  port: 5432,
});

async function insertAndSelectConcerts(maxEntries: number) {
  let insertExecutionTimes: number[] = [];
  let selectExecutionTimes: number[] = [];
  let insertedConcertIds: string[] = [];  // Store concert IDs from insert

  await client.connect();

  const concertName = 'Concert';
  const venue = 'Venue XYZ';
  
  // Starting date
  const dateString = '2024-11-14'
  let currentDate = new Date(dateString); 

  // INSERT concerts and store the generated concertId
  for (let i = 0; i < maxEntries; i++) {
    // const concertId = uuidv4();  // Generate a UUID v4
    const concertId = uuidv7(); // Generate a UUID v7

    // Format concert date in ISO format (YYYY-MM-DD)
    const concertDateISO = currentDate.toISOString().split('T')[0];

    // Set reservation start time to 19:00:00 on the current concert date
    const reservationStartTime = new Date(currentDate);
    reservationStartTime.setHours(19, 0, 0, 0);
    const reservationStartTimeISO = reservationStartTime.toISOString();

    const insertQuery = `
      EXPLAIN ANALYZE INSERT INTO "Concerts" 
      ("id", "name", "venue", "concert_date", "max_seats", "created_at", "updated_at", "reservation_start_time")
      VALUES ($1, $2, $3, $4, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5);
    `;
    
    const insertRes = await client.query(insertQuery, [concertId, concertName, venue, concertDateISO, reservationStartTimeISO]);
    console.log(`Insertion ${i + 1} result:`, insertRes.rows);

    const insertTimeRow = insertRes.rows.find(row => row['QUERY PLAN'].includes('Execution Time'));
    if (insertTimeRow) {
      const insertTime = parseFloat(insertTimeRow['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/)[1]);
      insertExecutionTimes.push(insertTime);
    }

    // Save the generated concertId to the array for later SELECT
    insertedConcertIds.push(concertId);

    // Increment the current date by 1 day
    currentDate.setDate(currentDate.getDate() + 1);

    await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
  }

  // SELECT concerts based on stored concertIds
  for (let i = 0; i < insertedConcertIds.length; i++) {
    const concertId = insertedConcertIds[i];  // Use the stored concertId from the insert step

    const selectQuery = `
      EXPLAIN ANALYZE SELECT * FROM "Concerts" WHERE "id" = $1;
    `;
    
    const selectRes = await client.query(selectQuery, [concertId]);
    console.log(`Selection ${i + 1} result:`, selectRes.rows);

    const selectTimeRow = selectRes.rows.find(row => row['QUERY PLAN'].includes('Execution Time'));
    if (selectTimeRow) {
      const selectTime = parseFloat(selectTimeRow['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/)[1]);
      selectExecutionTimes.push(selectTime);
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
  }

  // Calculate average execution times
  const avgInsertTime = insertExecutionTimes.reduce((sum, time) => sum + time, 0) / insertExecutionTimes.length;
  const avgSelectTime = selectExecutionTimes.reduce((sum, time) => sum + time, 0) / selectExecutionTimes.length;

  console.log(`Average INSERT Execution Time: ${avgInsertTime.toFixed(2)} ms`);
  console.log(`Average SELECT Execution Time: ${avgSelectTime.toFixed(2)} ms`);

  // DELETE the inserted concerts
  const deleteQuery = `DELETE FROM "Concerts" WHERE "concert_date" >= '${dateString}' AND "concert_date" < ('${dateString}'::date + INTERVAL '10 days');`;

  const deleteRes = await client.query(deleteQuery);
  console.log(`Deleted ${deleteRes.rowCount} rows from Concerts table`);
  
  await client.end();
}

const maxEntries = 10;  // Insert and select 10 concerts
insertAndSelectConcerts(maxEntries);
