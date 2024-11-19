const connection = require('../database/database');

class Model_Admin{
    static async getLaporanAkunKomersil(){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT
                pelapor.nama_users AS pelapor,
                yang_dilaporkan.nama_users AS yang_dilaporkan,
                la.file_foto,
                la.file_video,
                la.jenis_laporan,
                la.deskripsi_lapor_akun
            FROM lapor_akun_laporan_sampah_komersil la
            JOIN kotak_laporan_sampah_komersil kl
                ON la.id_kotak_laporan_sampah_komersil = kl.id_kotak_laporan_sampah_komersil
            JOIN laporan_sampah_komersil ls
                ON kl.id_laporan_sampah_komersil = ls.id_laporan_sampah_komersil
            JOIN warga w
                ON ls.id_warga = w.id_warga
            JOIN users yang_dilaporkan
                ON yang_dilaporkan.id_users = w.id_users
            JOIN mitra m
                ON kl.id_mitra = m.id_mitra
            JOIN users pelapor
                ON pelapor.id_users = m.id_users
            WHERE m.jenis_mitra = 'non-pemerintah';`
                , (err, rows) => {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                    console.log(rows);
                }
            });
        });
    }

    static async getSingleLaporanAkunKomersil(id_la){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT
                pelapor.nama_users AS pelapor,
                yang_dilaporkan.nama_users AS yang_dilaporkan,
                la.id_lapor_akun_laporan_sampah_komersil,
                la.file_foto,
                la.file_video,
                la.jenis_laporan,
                la.deskripsi_lapor_akun
                FROM lapor_akun_laporan_sampah_komersil la
                JOIN kotak_laporan_sampah_komersil kl
                ON la.id_kotak_laporan_sampah_komersil = kl.id_kotak_laporan_sampah_komersil
                JOIN laporan_sampah_komersil ls
                ON kl.id_laporan_sampah_komersil = ls.id_laporan_sampah_komersil
                JOIN warga w
                ON ls.id_warga = w.id_warga
                JOIN users yang_dilaporkan
                ON yang_dilaporkan.id_users = w.id_users
                JOIN mitra m
                ON kl.id_mitra = m.id_mitra
                JOIN users pelapor
                ON pelapor.id_users = m.id_users
                WHERE la.id_lapor_akun_laporan_sampah_komersil = ?`, [id_la]
                , (err, rows) => {
                if(err){
                    reject(err);
                } else {
                    resolve(rows[0]);
                    console.log(rows);
                }
            });
        });
    }

    static async getLaporanIlegal() {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT
                pelapor.nama_users AS pelapor,
                lsi.mac_address AS yang_dilaporkan,
                li.file_foto,
                li.file_video,
                li.jenis_laporan,
                li.deskripsi_lapor_akun,
                lsi.status_device
                FROM lapor_akun_laporan_sampah_ilegal li
                JOIN kotak_laporan_sampah_ilegal kl
                    ON li.id_kotak_laporan_sampah_ilegal = kl.id_kotak_laporan_sampah_ilegal
                JOIN laporan_sampah_ilegal lsi
                    ON kl.id_laporan_sampah_ilegal = lsi.id_laporan_sampah_ilegal
                JOIN mitra m
                    ON kl.id_mitra = m.id_mitra
                JOIN users pelapor
                    ON pelapor.id_users = m.id_users
                WHERE m.jenis_mitra = 'pemerintah';
            `, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getAdminLogin(id){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM users WHERE id_users = ?', [id], (err, rows) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                    console.log(rows);
                }
            })
        })
    }
    
}

module.exports = Model_Admin