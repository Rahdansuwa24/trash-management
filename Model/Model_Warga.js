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

    static async getAllData(){
        return new Promise((resolve, reject) => {
            connection.query('SELECT w.*, u.id_users, u.nama_users, u.email, u.status FROM warga w JOIN users u ON w.id_users = u.id_users ORDER BY id_warga DESC', (err, rows) => {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                    console.log(rows);
                }
            });
        });
    }
    
    static async getAllDataBalasan(macAddress){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT b.deskripsi_balasan, b.file_foto, b.file_video, u.nama_users FROM balasan_laporan_sampah_ilegal b 
                JOIN mitra m ON b.id_mitra = m.id_mitra 
                JOIN users u ON u.id_users = m.id_users 
                JOIN laporan_sampah_ilegal ls ON  b.id_laporan_sampah_ilegal = ls.id_laporan_sampah_ilegal
                WHERE ls.mac_address = ?
                ORDER BY b.id_balasan_laporan_sampah_ilegal DESC`, [macAddress], (err, rows) => {
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
            connection.query('INSERT INTO warga SET ?', Data, (err, result)=>{
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
            connection.query('SELECT * FROM warga WHERE id_warga = ?', [id], (err, result)=>{
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
            connection.query('SELECT * FROM warga WHERE id_users = ?', [id], (err, result)=>{
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
            connection.query('DELETE FROM warga WHERE id_warga = ?', [id], (err, result)=>{
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