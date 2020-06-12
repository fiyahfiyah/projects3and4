var express = require('express');
var database = require('../database');
var protectdata = require('../routes/protected');

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
let data = Object.keys(protectdata[0]);
generateTableHead(table, data);
generateTable(table, protectdata);
