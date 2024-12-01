const connection = require('../database/database');

class Model_Admin{
    static async getLaporanAkunKomersil(){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT
                ls.mitra AS pelapor,
                yang_dilaporkan.nama_users AS yang_dilaporkan,
                la.id_lapor_akun_laporan_sampah_komersil,
                la.judul_lapor_akun,
                la.file_foto,
                la.file_video,
                la.deskripsi_lapor_akun
                FROM lapor_akun_laporan_sampah_komersil la
				JOIN laporan_sampah_komersil ls
                ON la.id_laporan_sampah_komersil = ls.id_laporan_sampah_komersil
                JOIN warga w
                ON ls.id_warga = w.id_warga
                JOIN users yang_dilaporkan
                ON yang_dilaporkan.id_users = w.id_users
                ORDER BY waktu_lapor DESC`
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
                ls.mitra AS pelapor,
                yang_dilaporkan.nama_users AS yang_dilaporkan,
                la.id_lapor_akun_laporan_sampah_komersil,
                la.judul_lapor_akun,
                la.file_foto,
                la.file_video,
                la.deskripsi_lapor_akun
                FROM lapor_akun_laporan_sampah_komersil la
				JOIN laporan_sampah_komersil ls
                ON la.id_laporan_sampah_komersil = ls.id_laporan_sampah_komersil
                JOIN warga w
                ON ls.id_warga = w.id_warga
                JOIN users yang_dilaporkan
                ON yang_dilaporkan.id_users = w.id_users
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
                lsi.mitra AS pelapor,
                lsi.mac_address AS yang_dilaporkan,
                lsi.nomor_hp,
                li.file_foto,
                li.file_video,
                li.judul_lapor_akun,
                li.deskripsi_lapor_akun,
                lsi.status_device
                FROM lapor_akun_laporan_sampah_ilegal li
                JOIN laporan_sampah_ilegal lsi
                    ON li.id_laporan_sampah_ilegal = lsi.id_laporan_sampah_ilegal
                ORDER BY li.id_lapor_akun_laporan_sampah_ilegal;
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

    static async freezeAcc(id) {
        return new Promise((resolve, reject) => {
            connection.query('UPDATE users SET status = "frozen" WHERE id_users = ?', [id], function(err, result){
                if(err){
                    console.error('Error updating account:', err);
                    reject(err);
                } else {
                    console.log('Update result:', result);
                    resolve(result);
                }
            })
        });
    }

    static async ActivateAcc(id) {
        return new Promise((resolve, reject) => {
            connection.query(`UPDATE users SET status = 'active' WHERE id_users = ?`, [id], function(err, result){
                if(err){
                    console.error('Error updating account:', err);
                    reject(err);
                } else {
                    console.log('Update result:', result);
                    resolve(result);
                }
            })
        });
    }

    // static async blockAcc(id) {
    //     return new Promise((resolve, reject) => {
    //         connection.query('UPDATE users SET status = "blocked" WHERE id_users = ?', [id], function(err, result){
    //             if(err){
    //                 console.error('Error updating account:', err);
    //                 reject(err);
    //             } else {
    //                 console.log('Update result:', result);
    //                 resolve(result);
    //             }
    //         })
    //     });
    // }
    
}

module.exports = Model_Admin