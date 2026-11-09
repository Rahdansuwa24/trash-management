const pool = require('../pool');

async function up() {
  const connection = await pool.getConnection();
  try {
    console.log('Running migration: Add rt_tugas to profiles_mitra...');

    // Check if column already exists
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'profiles_mitra' 
        AND COLUMN_NAME = 'rt_tugas'
    `);

    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE profiles_mitra 
        ADD COLUMN rt_tugas VARCHAR(10) NULL DEFAULT 'ALL' AFTER wilayah_tugas,
        ADD INDEX idx_mitra_rt_tugas (rt_tugas)
      `);
      console.log('Column rt_tugas added successfully.');
    } else {
      console.log('Column rt_tugas already exists.');
    }

    // Set initial values based on existing data
    await connection.query(`
      UPDATE profiles_mitra 
      SET rt_tugas = 'ALL' 
      WHERE jenis_mitra = 'satgas_lapangan' OR wilayah_tugas LIKE '%RW%'
    `);

    await connection.query(`
      UPDATE profiles_mitra 
      SET rt_tugas = '03' 
      WHERE instansi_nama LIKE '%RT 03%' OR wilayah_tugas LIKE '%RT 03%'
    `);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { up };
