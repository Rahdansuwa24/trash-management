const connection = require('../database/database');

class Model_Warga{
    static async getAll(){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM warga ORDER BY id_warga DESC', (err, rows) => {
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
            connection.query('INSERT INTO laporan_sampah_komersil SET ?', [Data], (err, result)=>{
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
            connection.query('SELECT * FROM laporan_sampah_komersil WHERE id_laporan_sampah_komersil = ?', [id], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }

    static async getDataByIdLpSampahKomersil(id){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT ls.*, u.id_users, u.nama_users FROM laporan_sampah_komersil ls 
                JOIN warga w ON ls.id_warga = w.id_warga
                JOIN users u ON w.id_users = u.id_users 
                WHERE ls.id_laporan_sampah_komersil = ?`, [id], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }

    static async getSampahKomersil(){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT count(jenis_sampah) as jumlah,jenis_sampah, id_warga FROM laporan_sampah_komersil ls 
                GROUP BY jenis_sampah, id_warga`, (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result);
                }
            })
        })
    }
    static async countPenjualan(id_warga){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT count(id_warga) as jumlah FROM laporan_sampah_komersil ls 
                where id_warga = ?`, [id_warga],(err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0].jumlah);
                }
            })
        })
    }

    static async Update(id){
        return new Promise((resolve, reject) => {
            connection.query('UPDATE warga SET ? WHERE id_warga = ?', [Data, id], (err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0]);
                }
            })
        })
    }

    static async Delete(id){
        return new Promise((resolve, reject) => {
            connection.query('DELETE FROM laporan_sampah_komersil WHERE id_sampah_komersil = ?', [id], (err, result)=>{
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

module.exports = Model_Warga