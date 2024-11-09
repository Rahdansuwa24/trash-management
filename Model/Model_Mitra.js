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