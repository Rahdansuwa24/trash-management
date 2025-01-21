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

    static async countPenjualan(Mitra){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT count(id_laporan_sampah_ilegal) as jumlah FROM laporan_sampah_ilegal ls 
                where mitra = ?`, [Mitra],(err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0].jumlah);
                }
            })
        })
    }

    static async countPembelian(Mitra){
        return new Promise((resolve, reject) => {
            connection.query(`SELECT count(id_balasan_laporan_sampah_ilegal) as jumlah FROM balasan_laporan_sampah_ilegal ls 
                where id_mitra = ?`, [Mitra],(err, result)=>{
                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result[0].jumlah);
                }
            })
        })
    }

    static async getAllData(){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM laporan_sampah_ilegal ORDER BY id_laporan_sampah_ilegal DESC', (err, rows) => {
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
            connection.query('INSERT INTO laporan_sampah_ilegal SET ?', [Data], (err, result)=>{
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


    static async getIdLpIlegal(id){
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM laporan_sampah_ilegal WHERE id_laporan_sampah_ilegal = ?', [id], (err, result)=>{

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

            connection.query('DELETE FROM laporan_sampah_ilegal WHERE id_laporan_sampah_ilegal = ?', [id], (err, result)=>{

                if(err){
                    reject(err);
                    console.log(err)
                }else{
                    resolve(result);

                }
            })
        })
    }
}

module.exports = Model_Warga