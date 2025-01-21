const connection = require('../database/database');

class Model_Mitra{
    static async getAll(){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM mitra ORDER BY id_mitra DESC', (err, rows) => {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                    console.log(rows);
                }
            });
        });
    }

    static async getAllData(){
        return new Promise((resolve, reject) => {
            connection.query('SELECT m.*, u.nama_users, u.id_users, u.email FROM mitra m JOIN users u ON m.id_users = u.id_users ORDER BY m.id_mitra DESC', (err, rows) => {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                    console.log(rows);
                }
            });
        });
    }

    static async Store(Data){
        return new Promise((resolve, reject) => {
            connection.query('INSERT INTO mitra SET ?', Data, (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result);
                }
            })
        })
    }

    static async getId(id){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM mitra WHERE id_mitra = ?', [id], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }

    static async getByIdUsers(id){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM mitra WHERE id_users = ?', [id], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }

    static async getByTipe(jenisMitra){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM mitra WHERE jenis_mitra = ?',[jenisMitra], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }


    static async Update(id){
        return new Promise((resolve, reject) => {
            connection.query('UPDATE mitra SET ? WHERE id_mitra = ?', [Data, id], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }

    static async joinUsersMitra() {
        return new Promise((resolve, reject) => {
            const query = `
                 SELECT u.*, m.*
            FROM users u
            LEFT JOIN mitra m ON u.id_users = m.id_users
            WHERE m.jenis_mitra = 'non-pemerintah';
        `;
            connection.query(query,(err, result) => {
                if (err) {
                    reject(err);
                    console.log(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
    static async joinUsersMitraIlegal(kota) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.nama_users, m.kota, m.kecamatan FROM users u LEFT JOIN mitra m ON u.id_users = m.id_users WHERE m.kota = ? and m.jenis_mitra = 'pemerintah';
        `;
            connection.query(query, [kota],(err, result) => {
                if (err) {
                    reject(err);
                    console.log(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    static async joinUsersMitraKomersilTest(kota) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.nama_users, m.kota, m.kecamatan FROM users u LEFT JOIN mitra m ON u.id_users = m.id_users WHERE m.kota = ? and m.jenis_mitra = 'non-pemerintah';
            `;
            const values = [kota];
    
            connection.query(query, values, (err, result) => {
                if (err) {
                    reject(err);
                    console.error("Error Query SQL:", err);
                } else {
                    resolve(result);
                }
            });
        });
    }
    

    static async mitraKomersil(){
        return new Promise((resolve, reject) => {
            connection.query(`select w.no_telp, u.nama_users, l.longitude, l.latitude, l.file_foto, l.file_video, l.id_laporan_sampah_komersil, l.jenis_sampah from users u left join warga w on u.id_users = w.id_users left join laporan_sampah_komersil l on l.id_warga = w.id_warga where u.role_users = 'warga' order by l.id_laporan_sampah_komersil desc;`, (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result);
                }
            })
        })
    }

    static async countReportsForWarga(id_warga) {
        return new Promise((resolve, reject) => {
            connection.query(`SELECT COUNT(*) as jumlah_laporan FROM lapor_akun_laporan_sampah_komersil la 
                JOIN laporan_sampah_komersil ls 
                ON la.id_laporan_sampah_komersil = ls.id_laporan_sampah_komersil 
                WHERE ls.id_warga = ?`, 
            [id_warga], (err, result) => {
                if(err){
                    reject(err);
                }else{
                    resolve(result[0].jumlah_laporan);
                }
            })
        })
    }

    // static async getIdWargaFromLaporan(idLaporan) {
    //     return new Promise((resolve, reject) => {
    //         connection.query(`SELECT ls.id_warga FROM laporan_sampah_komersil ls
    //             JOIN warga w ON ls.id_warga = w.id_warga
    //             JOIN users u ON w.id_users = u.id_users
    //             WHERE ls.id_laporan_sampah_komersil = ?`
    //         [idLaporan], (err, result) => {
    //             if(err){
    //                 reject(err);
    //             }else{
    //                 resolve(result[0]);
    //                 console.log('USER-ID: ', result)
    //             }
    //         })
    //     })
    // }

    // static async getIdUsersFromLaporan(idLaporan) {
    //     return new Promise((resolve, reject) => {
    //         connection.query(`SELECT u.id_users FROM laporan_sampah_ilegal ls
    //             JOIN warga w ON ls.id_warga = w.id_warga
    //             JOIN users u ON w.id_users = u.id_users
    //             WHERE ls.id_laporan_sampah_komersil = ?`
    //         [idLaporan], (err, result) => {
    //             if(err){
    //                 reject(err);
    //             }else{
    //                 resolve(result[0]);
    //                 console.log('USER-ID: ', result)
    //             }
    //         })
    //     })
    // }

    static async getIdUsersByWarga(idWarga){
        return new Promise((resolve, reject) => {
            connection.query('SELECT id_users FROM warga WHERE id_warga = ?' ,[idWarga] ,(err, result) =>{
                if(err){
                    reject(err);
                    console.error('Error pada fungsi getIDUbyWarga', err)
                }else{
                    resolve(result[0].id_users);
                    console.log('Hasil id user: ', result)
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

    static async checkAndFreezeAccount(id_warga) {
        try {
            const reportCount = await this.countReportsForWarga(id_warga);
            console.log('Jumlah Laporan: ', reportCount);
            
            if (reportCount >= 3) {
                const idUsers = await this.getIdUsersByWarga(id_warga);
                console.log('IDU: ', idUsers);

                await this.freezeAcc(idUsers);
                console.log(`Akun warga dengan id ${id_warga} dibekukan karena memiliki ${reportCount} laporan`);
            }
        } catch (error) {
            console.error('Kesalahan saat memeriksa dan memblokir akun:', error);
        }
    }

    static async getIdWargaFromReport(idLaporan) {
        return new Promise((resolve, reject) => {
            connection.query(
                `SELECT id_warga FROM laporan_sampah_komersil WHERE id_laporan_sampah_komersil = ?`, 
                [idLaporan], 
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results[0].id_warga);
                        console.log('ID WARGA: ', results);
                    }
                }
            );
        });
    }

    static async laporAkunKomersil(data){
        return new Promise((resolve, reject) => {
            connection.query(`INSERT INTO lapor_akun_laporan_sampah_komersil SET ?`, data, async (err, result)=> {
                if(err){
                    reject(err);
                    console.log(err);
                }else{
                    const iDWarga = await this.getIdWargaFromReport(data.id_laporan_sampah_komersil);
                    console.log('Warga ID: ', iDWarga);
                    await this.checkAndFreezeAccount(iDWarga);
                    resolve(result);
                }
            })
        })
    }

    static async laporAkunIlegal(data){
        return new Promise((resolve, reject) => {
            connection.query(`INSERT INTO lapor_akun_laporan_sampah_ilegal SET ?`, data, (err, result)=> {
                if(err){
                    reject(err);
                    console.log(err);
                }else{
                    resolve(result)
                }
            })
        })
    }

    static async BalasLaporanIlegal(data){
        return new Promise((resolve, reject) => {
            connection.query(`INSERT INTO balasan_laporan_sampah_ilegal SET ?`, data, (err, result)=> {
                if(err){
                    reject(err);
                    console.log(err);
                }else{
                    resolve(result)
                }
            })
        })
    }
    


    static async Delete(id){
        return new Promise((resolve, reject) => {
            connection.query('DELETE FROM mitra WHERE id_mitra = ?', [id], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }
}

module.exports = Model_Mitra