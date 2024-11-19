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
    static async joinUsersMitraIlegal() {
        return new Promise((resolve, reject) => {
            const query = `
                 SELECT u.*, m.*
            FROM users u
            LEFT JOIN mitra m ON u.id_users = m.id_users
            WHERE m.jenis_mitra = 'pemerintah';
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

    static async joinUsersMitraKomersilTest(kota, kecamatan) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.nama_users, m.kota, m.kecamatan
                FROM users u
                LEFT JOIN mitra m ON u.id_users = m.id_users
                WHERE (m.kota = ? OR ? IS NULL)
                  AND (m.kecamatan = ? OR ? IS NULL)
                  AND m.jenis_mitra = 'non-pemerintah';
            `;
            const values = [kota, kota, kecamatan, kecamatan];
    
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
    

    static async KotaKelurahan(){
        return new Promise((resolve, reject) => {
            connection.query('select u.*, m.* from users u left join mitra m on u.id_users = m.id_users order by u.nama_users desc', (err, result)=>{
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