// terminal check for connection
var mysql = require('mysql');

var con = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password1',
	database: 'project4',
});

con.connect(function (err) {
	if (err) throw err;
	console.log('Connected!');
});

module.exports = con;
