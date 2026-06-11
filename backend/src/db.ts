import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'antrian_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query<T>(sql: string, values?: any[]): Promise<T[]> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, (values || []) as any);
    return rows as T[];
  } finally {
    connection.release();
  }
}

export async function queryOne<T>(sql: string, values?: any[]): Promise<T | null> {
  const results = await query<T>(sql, values);
  return results.length > 0 ? results[0] : null;
}

export async function execute(sql: string, values?: any[]): Promise<{ affectedRows: number; insertId: number }> {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(sql, (values || []) as any);
    return {
      affectedRows: (result as { affectedRows: number }).affectedRows,
      insertId: (result as { insertId: number }).insertId
    };
  } finally {
    connection.release();
  }
}
