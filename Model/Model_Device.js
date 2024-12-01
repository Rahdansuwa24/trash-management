const connection = require('../database/database');

class Model_Device{
    static async getStatusByMacAddress(mac_address){
        return new Promise((resolve, reject) => {
          connection.query('SELECT status_device FROM laporan_sampah_ilegal WHERE mac_address = ?', [mac_address], (err, result) => {
            if(err){
              reject(err)
            } else {
              const statusDevice = result.length > 0 ? result[0].status_device : null;
              resolve(statusDevice);
            }
          });
        });
      }

      static async countReportsForDevice(macAddress) {
        return new Promise((resolve, reject) => {
            connection.query(
                `SELECT COUNT(*) as report_count FROM lapor_akun_laporan_sampah_ilegal l
                JOIN laporan_sampah_ilegal ls ON l.id_laporan_sampah_ilegal = ls.id_laporan_sampah_ilegal
                WHERE ls.mac_address = ?`, 
                [macAddress], 
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results[0].report_count);
                    }
                }
            );
        });
    }
    
    static async checkAndBlockDevice(macAddress) {
        try {
            const reportCount = await this.countReportsForDevice(macAddress);
            
            if (reportCount >= 3) {
                await this.blockDevice(macAddress);
                console.log(`Device ${macAddress} diblokir karena memiliki ${reportCount} laporan`);
            }
        } catch (error) {
            console.error('Kesalahan saat memeriksa dan memblokir device:', error);
        }
    }

    static async getMacAddressFromReport(idLaporan) {
        return new Promise((resolve, reject) => {
            connection.query(
                'SELECT mac_address FROM laporan_sampah_ilegal WHERE id_laporan_sampah_ilegal = ?', 
                [idLaporan], 
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results[0].mac_address);
                        console.log('mac laporan: ', resolve);
                    }
                }
            );
        });
    }
    
    static async laporAkunIlegal(data) {
        return new Promise((resolve, reject) => {
            connection.query(`INSERT INTO lapor_akun_laporan_sampah_ilegal SET ?`, data, async (err, result) => {
                if (err) {
                    reject(err);
                    console.log(err);
                } else {
                    const macAddress = await this.getMacAddressFromReport(data.id_laporan_sampah_ilegal);
                    await this.checkAndBlockDevice(macAddress);
                    resolve(result);
                    console.log('MacAddress: ', macAddress);
                }
            });
        });
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