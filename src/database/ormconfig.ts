import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

const typeORMconfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'course_service_db',
  synchronize: true,  // 개발 환경에서는 true, 운영 환경에서는 false로 설정
  logging: true,
  entities: [join(__dirname, '..', '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', '..', 'migration', '*.{ts,js}')],
};

const AppDataSource = new DataSource(typeORMconfig);

export default AppDataSource;