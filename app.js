var express = require('express');
var ItemDB = require('./models/ItemDB');
var regex = require('regex');
var profileController = require('./controls/ProfileController');
var catalogController = require('./controls/CatalogController');

var app = express();

app.use(profileController);
app.use(catalogController);

app.set('view engine', 'ejs');
app.set('views', './views');

app.use('/resources', express.static('./resources'));

app.use(function (req, res, next) {
	if (req.session.theUser === undefined) {
		res.locals.loginFlag = false;
		res.locals.userFName = null;
	}else{
		res.locals.loginFlag = true;
		res.locals.userFName = req.session.theUser.firstName;
	}
	next();
});

app.get('/', function (req, res) {
	res.render('index');
});

app.get('/index', function (req, res) {
	res.render('index');
});

app.get('/login', function (req, res) {
	res.render('login', {loginMsg: ""});
});

app.get('/register', function (req, res) {
	res.render('register', {registerMsg: ""});
});

app.get('/about', function (req, res) {
	res.render('about');
});

app.get('/contact', function (req, res) {
	res.render('contact');
});

app.get('/store', function (req, res) {
	res.render('store');
});

app.get('/swap', function (req, res) {
	res.render('swap');
});

/*app.get('/mySwaps', function (req, res) {
	res.render('mySwaps');
});*/

app.listen(8080);