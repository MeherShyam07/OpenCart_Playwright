import mysql, { type ExecuteValues, type QueryResult, type RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function executeQuery<T extends QueryResult = RowDataPacket[]>(
    sql: string,
    params?: ExecuteValues
): Promise<T> {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [result] = await connection.execute<T>(sql, params);
        return result;
    } finally {
        await connection.end();
    }
}