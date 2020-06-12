var express = require('express');
var router = express.Router();
var database = require('../database');

// render page
router.get('/', async function (req, res, next) {
	/* query database for table */
	const results = await new Promise((resolve, reject) => {
		database.query(
			'SELECT users.lastName, users.firstName, day, timestart,timeend FROM schedule LEFT JOIN users ON schedule.ID_user = users.ID_user',
			function (err, rows) {
				// reject on error
				if (err) return reject(err);
				// resolve rows
				resolve(rows);
			}
		);
	});
	// console.log(results);
	res.render('protected', { results });
});

module.exports = router;
