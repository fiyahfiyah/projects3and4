var express = require('express');
var router = express.Router();
var database = require('../database');

/* GET users listing. */
let getdata = router.get('/protected', function (req, res, next) {
	/* query database for table */
	/* if you need specific data pulled, you do data: rows - data you reference in jade file, rows come from function */
	/* here, because we only want all results, use result function */
	/* query database for table */
	database.query('SELECT * FROM schedule', function (err, result) {
		if (err) throw Error;
		res.render('/protected', { result });
	});
});

function generateTableHead(table, data) {
	let thead = table.createTHead();
	let row = thead.insertRow();
	for (let key of data) {
		let th = document.createElement('th');
		let text = document.createTextNode(key);
		th.appendChild(text);
		row.appendChild(th);
	}
}

function generateTable(table, data) {
	for (let element of data) {
		let row = table.insertRow();
		for (let key in element) {
			let cell = row.insertCell();
			let text = document.createTextNode(element[key]);
			cell.appendChild(text);
		}
	}
}
let table = document.querySelector('table');
let data = Object.keys(getdata[0]);
generateTableHead(table, data);
generateTable(table, getdata);
