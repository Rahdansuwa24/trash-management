const connection = require('../database/database');

class Model_Device{
    static async getStatusByMacAddress(mac_address){
        return new Promise((resolve, reject) =>{
            connection.query('SELECT status_device FROM laporan_sampah_ilegal WHERE mac_address = ?',
            [mac_address], (err, result) => {
                if(err){
                    reject(err)
                }else{
                    resolve(result)
                    console.log(result)
                }
            })
        })
    }

    static async blockDevice(macAddress){
        return new Promise((resolve, reject) =>{
            connection.query('UPDATE laporan_sampah_ilegal SET status_device = "blocked" WHERE mac_address = ?', [macAddress], (err, result) =>{
                if(err){
                    reject(err)
                    console.log(err);
                }else{
                    resolve(result)
                }
            })
        })
    }

    static async unblockDevice(macAddress){
        return new Promise((resolve, reject) =>{
            connection.query('UPDATE laporan_sampah_ilegal SET status_device = "active" WHERE mac_address = ?', [macAddress], (err, result) =>{
                if(err){
                    reject(err)
                    console.log(err);
                }else{
                    resolve(result)
                }
            })
        })
    }

}

module.exports = Model_Device