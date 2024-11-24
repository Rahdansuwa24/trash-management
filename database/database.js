require('dotenv').config()
let mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_manajemensampah',
})
connection.connect((error)=>{
    if(!!error){
        console.log(error)
    }else{
        console.log('Terhubung')
    }
})
module.exports=connection;