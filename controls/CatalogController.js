var express = require('express');
var app = module.exports = express();
var async = require("async");
var UserProfile = require('../models/UserProfile');
var ItemModel = require('../models/ItemDB');
var UserModel = require('../models/UserDB');

var itemCodeRegex = RegExp(/^([a-z]{3}[0-9]{3})$/);

var session = require('express-session');
app.use(session({secret: 'user-profile-session', resave:true, saveUninitialized:true}));

var validator = require('express-validator');
const { check, oneOf, validationResult } = require('express-validator/check');
app.use(validator());

app.set('view engine', 'ejs');
app.use('/resources', express.static('resources'));

var itemCodeMatches;
var currentItem;
var userItemIndex;
var userItemCode;
var categories;
var items;
var otherUserItems;
var userCategory;
var categoryMatch;
var userProf;
var user;

UserModel.getUser("user1").then(docs => {
	user = docs;
}).catch(err =>{
        console.error(err);
    });

ItemModel.getUserItems("user1").then(docs => {
	userProf = new UserProfile("user1", docs);
}).catch(err =>{
	    console.error(err);
	});

var itemCodeRegex = RegExp(/^([a-z]{3}[0-9]{3})$/);

//middleware function to validate item code as per the regex expression provided
var validateItemCode = function (req, res) {
	itemCodeMatches = false;
	if(itemCodeRegex.test(userItemCode)){
		console.log('Item Code is valid.');
		itemCodeMatches = true;
	}else{
		console.log('Item Code is Invalid.');
	}
};

//middleware function to validate category of the item
var validateCategory = function (req, res) {
	categoryMatch = false;

	ItemModel.find().distinct('catalogCategory', function(error, categoriesDoc) {
		if (error) return res.send(500, { error: err });
		categories = categoriesDoc;
		for (var i = 0; i < categories.length; i++) {
			if(userCategory === categories[i]){
				categoryMatch = true;
			}
		}
	});	
};

//get all the categories from items collection
ItemModel.getAllCategories().then(docs => {
		categories = docs;
    }).catch(err =>{
            console.error(err);
    	});

//get all the items from items collection
ItemModel.getAllItems().then(docs => {
		items = docs;	
}).catch(err =>{
	    console.error(err);
	});

////middleware function to take the user to item page
var displayItem = function (req, res) {
	validateItemCode(req, res);
	console.log('Item Code:'+ userItemCode);
	var item;
	ItemModel.getItem(userItemCode).then(docs => {
		item = docs;
		if(itemCodeMatches && (typeof item !== "undefined")){
			req.session.theItem = item;
			req.session.save();
			res.render('item', {item, msg: ""});
		}else{
			res.render('categories', {categories, items});
		}
    }).catch(err =>{
            console.error(err);
    	});
};

app.get('/categories*', function (req, res) {
	//if the user is not logged in, then display all the categories and items available
	if(!req.session.theUser || req.session.theUser == undefined ){
		res.locals.loginFlag = false;
		res.locals.userFName = null;
		res.render('categories', {categories, items});
	}else if(req.query.itemCode){
	    	res.locals.loginFlag = true;
	    	res.locals.userFName = req.session.theUser.firstName;
	    	userItemCode = req.query.itemCode;
	    	displayItem(req, res);
	    }else{
	    	res.locals.loginFlag = true;
	    	res.locals.userFName = req.session.theUser.firstName;
	    	//if user is logged in, then display only other user items
	    	ItemModel.getOtherUserItems(req.session.theUser.userId).then(docs => {
					otherUserItems = docs;
					res.render('categories', {categories, items: otherUserItems});
			}).catch(err =>{
				    console.error(err);
				});
	    } 	 
});
