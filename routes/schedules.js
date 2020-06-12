var express = require('express');
var router = express.Router();
var database = require('../database');

router.post('/', function (req, res, next) {
	const userDetails = req.body;
	// console.log(typeof userDetails);
	// console.log(userDetails);
	const userDetailsID = req.cookies.userIDCookie;
	console.log(userDetailsID);
	// console.log(req.cookies);
	const newDetails = { ...userDetails, ID_user: userDetailsID };
	// console.log(newDetails);
	var sql = 'INSERT INTO schedule SET ?';
	database.query(sql, newDetails, function (err, data) {
		if (err) throw err;
		console.log('schedule added');
	});
	res.redirect('/schedules');
});

router.get('/', async function (req, res, next) {
	/* query database for table */
	const results = await new Promise((resolve, reject) => {
		database.query(
			'SELECT day, timestart,timeend FROM schedule LEFT JOIN users ON schedule.ID_user = req.cookies.userIDcookie',
			function (err, rows) {
				// reject on error
				console.log(rows);
				if (err) return reject(err);
				// resolve rows
				resolve(rows);
			}
		);
	});
	// console.log(results);
	res.render('schedules', { results });
});

module.exports = router;
