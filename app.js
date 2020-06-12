var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var database = require('./database');
var helpers = require('./helpers/handlebarHelpers');

// *************************************************** //
/////////////////////////////////////////////////////////
////////////////////ADDITIONS////////////////////////////
/////////////////////////////////////////////////////////
// *************************************************** //

// handlebars - render HTML pages on the server side
// body parser - parse HTTP request bodies
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');

var protectedRouter = require('./routes/protected');
var scheduleRouter = require('./routes/schedules');

// Introduce hbs
var app = express();

// To support URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cookieParser());

app.engine(
	'hbs',
	exphbs({
		extname: '.hbs',
		helpers: helpers.hbsHelpers,
	})
);

app.set('view engine', 'hbs');

// Our requests hadlers will be implemented here...

app.listen(3030);

/////////////////////////////////////////////////////////
///////////////////////ROUTES////////////////////////////
/////////////////////////////////////////////////////////
// render home page at root
app.get('/', function (req, res) {
	res.render('home');
});

// render registration page
app.get('/register', (req, res) => {
	res.render('register');
});

// render login page
app.get('/login', (req, res) => {
	res.render('login');
});

// render protected page
// require access authorisation
//  res.cookie('AuthToken', authToken) - set cookie
//  const authToken = req.cookies['AuthToken'] - get cookie

const requireAuth = (req, res, next) => {
	if (req.cookies['AuthToken']) {
		console.log('cookie check success');
		next();
	} else {
		console.log('cookie check fail');
		res.render('./login.hbs', {
			message: 'Please login to continue',
			messageClass: 'alert-danger',
		});
	}
};

// render add schedules page
app.get('/schedules', (req, res) => {
	res.render('schedules');
});

/////////////////////////////////////////////////////////
//////////////////////HASHING////////////////////////////
/////////////////////////////////////////////////////////

// hash any passwords registered
const crypto = require('crypto');

const getHashedPassword = (password) => {
	const sha256 = crypto.createHash('sha256');
	const hash = sha256.update(password).digest('base64');
	return hash;
};

// generate auth token and send as cookie
const generateAuthToken = () => {
	return crypto.randomBytes(30).toString('hex');
};

/////////////////////////////////////////////////////////
//////////////////////REGISTER///////////////////////////
/////////////////////////////////////////////////////////

const users = [
	// This user is added to the array to avoid creating a new user on each restart
	{
		firstName: 'Test',
		lastName: 'Name',
		email: 'test@email.com',
		// This is the SHA256 hash for value of `password`
		password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg=',
	},
];

app.post('/register', async (req, res) => {
	// async means we call from db
	const { email, firstName, lastName, password, confirmPassword } = req.body;
	// Check if the password and confirm password fields match
	if (password === confirmPassword) {
		// Check if user with the same email is also registered
		const exists = await new Promise((resolve, reject) => {
			database.query(
				// count all rows where email is the same as rego form
				'SELECT COUNT(*) FROM users WHERE email = ?',
				[email],
				(err, data) => {
					if (err) return reject(err);
					resolve(data);
				}
			);
		});
		// console.log(exists, exists['COUNT(*)']);
		if (exists[0]['COUNT(*)'] > 0) {
			res.render('./register.hbs', {
				message: 'User already registered.',
				messageClass: 'alert-danger',
			});
			return;
		}

		const hashedPassword = getHashedPassword(password);

		// push to users array - don't push to array as memory runs out when large # users
		// users.push({
		// 	firstName,
		// 	lastName,
		// 	email,
		// 	password: hashedPassword,
		// });

		// console.log({ lastName, firstName, email, password: hashedPassword });
		await new Promise((resolve, reject) => {
			// push data into db
			database.query(
				'INSERT INTO users SET ?',
				{ lastName, firstName, email, password: hashedPassword },
				(err, data) => {
					if (err) return reject(err);
					resolve(data);
				}
			);
		});
		res.render('./login.hbs', {
			message: 'Registration Complete. Please login to continue.',
			messageClass: 'alert-success',
		});
	} else {
		res.render('./register.hbs', {
			message: 'Password does not match.',
			messageClass: 'alert-danger',
		});
	}
});

/////////////////////////////////////////////////////////
//////////////////STOREPASSWORDS/////////////////////////
/////////////////////////////////////////////////////////

// authTokens is a map that will hold the users and authToken related to users
const authTokens = {};

app.post('/login', async (req, res) => {
	const email = req.body.email;
	const dbpass = req.body.password;
	const hashedPassword = getHashedPassword(dbpass);
	database.query(
		'SELECT * FROM users WHERE email = ?',
		[email],
		async function (error, results, fields) {
			if (error) {
				res.send({
					code: 400,
					failed: 'error ocurred',
				});
			} else {
				if (results.length > 0) {
					const comparision =
						(await email) === results[0].email &&
						hashedPassword === results[0].password;
					if (comparision) {
						const authToken = generateAuthToken();

						// Store authentication token
						authTokens[authToken] = comparision;

						// Setting the auth token in cookies
						res.cookie('AuthToken', 'hellocookie');
						res.cookie('userIDCookie', results[0].ID_user);
						// console.log(req.cookies.userIDCookie);

						// Redirect user to the protected page
						res.redirect('/protected');
					} else {
						res.render('./login.hbs', {
							message: 'Invalid username or password',
							messageClass: 'alert-danger',
						});
					}
					// end else clause
				} else {
					res.render('./login.hbs', {
						message: 'Invalid username or password',
						messageClass: 'alert-danger',
					});
				}
				// end else clause
				// end else statement
			}
			// end else
			// end dbquery
			console.log(results);
		}
	);
	// end query
	// end post
});
// end post

// *************************************************** //
/////////////////////////////////////////////////////////
////////////////////END ADDITIONS////////////////////////
/////////////////////////////////////////////////////////
// *************************************************** //

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/protected', protectedRouter);
app.use('/schedules', scheduleRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
