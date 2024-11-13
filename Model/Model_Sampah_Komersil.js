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