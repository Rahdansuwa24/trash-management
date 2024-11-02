require('dotenv').config()
let mysql = require('mysql');
let connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATA
})
connection.connect((error)=>{
    if(!!error){
        console.log(error)
    }else{
        console.log('Terhubung')
    }
})
module.exports=connection;