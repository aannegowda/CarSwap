var express = require('express');
var app = module.exports = express();
var ItemModel = require('../models/ItemDB');
var UserModel = require('../models/UserDB');
var OfferModel = require('../models/OfferDB');
var UserProfile = require('../models/UserProfile');

var session = require('express-session');
app.use(session({secret: 'user-profile-session', resave:true, saveUninitialized:true}));

var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false,  useNewUrlParser: true});

var validator = require('express-validator');
const { check, oneOf, validationResult } = require('express-validator/check');
app.use(validator());

app.set('view engine', 'ejs');
app.use('/resources', express.static('resources'));

var user;
var userItemCode;
var itemMatches;
var itemCodeMatches;
var currentItem;
var myAction;
var userItemIndex;
var sessionProfile;
var currentItemStatus;
var userId;
var userProf;

var itemCodeRegex = RegExp(/^([a-z]{3}[0-9]{3})$/);

//middleware function to validate item code as per the regex expression provided
var validateItemCode = function (req, res) {
	itemCodeMatches = false;
	itemMatches = false;
	if(itemCodeRegex.test(userItemCode)){
		console.log('Item Code is valid.');
		itemCodeMatches = true;
		var currentItems = req.session.currentProfile.userItems;
		for (var i = 0; i < currentItems.length; i++) {
			if(currentItems[i].itemCode === userItemCode){
				itemMatches = true;
				currentItem = currentItems[i];
				userItemIndex = i;
			}
		}
	}else{
		console.log('Item Code is Invalid.');
	}
};

//middleware function to perform update action
var updateAction = function (req, res) {
	validateItemCode(req, res);
	if(itemCodeMatches && itemMatches){
		console.log('Current item status: '+currentItem.itemStatus);
		//If item status is pending, then take the user to My Swaps page
		//If item status is available or swapped, then take the user to Item page
		if(currentItem.itemStatus === 'pending'){
			var offerDetails;
			OfferModel.getOfferDetails(userItemCode).then(docs => {
				offerDetails = docs;
				res.render('mySwaps', {offerItems: offerDetails});
			}).catch(err =>{
			        console.error(err);
			    });
		}else if(currentItem.itemStatus === 'available' || currentItem.itemStatus === 'swapped'){
			var item;
			ItemModel.getItem(userItemCode).then(docs => {
					item = docs;
					req.session.userItem = currentItem;
					res.render('item', {item: req.session.userItem, msg: ""});	
			}).catch(err =>{
				    console.error(err);
				});
		}
	}else{
		res.render('myItems', {userProfile: req.session.currentProfile});
	}
};

//middleware function to perform accept, reject and withdraw actions
//If the action is accept, change item status to swapped
//If the action is reject or withdraw, change item status to available
var swapAction = function (req, res) {
	validateItemCode(req, res);
	if(itemCodeMatches && itemMatches){
		if(currentItem.itemStatus === 'pending'){
			sessionProfile = req.session.currentProfile;
			if(myAction === 'reject' || myAction === 'withdraw'){
				ItemModel.updateItemStatus(userItemCode, 'available');
				OfferModel.updateOfferStatus(userItemCode, 'available');
				//OfferModel.deleteOffer(userItemCode);
				currentItem.itemStatus = 'available';
				sessionProfile.userItems[userItemIndex] = currentItem;
				console.log('Item status changed: '+sessionProfile.userItems[userItemIndex].itemStatus);
			}else if(myAction === 'accept'){
				ItemModel.updateItemStatus(userItemCode, 'swapped');
				OfferModel.updateOfferStatus(userItemCode, 'swapped');
				currentItem.itemStatus = 'swapped';
				sessionProfile.userItems[userItemIndex] = currentItem;
				console.log('Item status changed: '+sessionProfile.userItems[userItemIndex].itemStatus);
			}
			req.session.sessionProfile = sessionProfile;
			res.render('myItems', {userProfile: req.session.sessionProfile});
		}else if(currentItem.status === 'available' || currentItem.status === 'swapped'){
			console.log("Checkpoint 4");
			var userOfferItems;
			OfferModel.getUserOffersByStatus(req.session.theUser.userId, "pending").then(docs => {
				userOfferItems = docs;
				res.render('mySwaps', {offerItems: userOfferItems});
			}).catch(err =>{
			        console.error(err);
			    });		
		}
	}else{
		var userOfferItems;
			OfferModel.getUserOffersByStatus(req.session.theUser.userId, "pending").then(docs => {
				userOfferItems = docs;
				res.render('mySwaps', {offerItems: userOfferItems});
			}).catch(err =>{
			        console.error(err);
			    });
	}
};

//middleware function to perform delete action
//Remove the item from the user's profile by deleting the item from items collection
var deleteAction = function (req, res) {
	validateItemCode(req, res);
	if(itemCodeMatches && itemMatches){
		ItemModel.deleteItem(userItemCode);

		ItemModel.getUserItems(req.session.theUser.userId).then(docs => {
					userProf = new UserProfile(req.session.theUser.userId, docs);
					req.session.currentProfile = userProf;
					res.render('myItems', {userProfile: req.session.currentProfile});
				}).catch(err =>{
					    console.error(err);
					});
	}else{
		res.render('myItems', {userProfile: req.session.currentProfile});
	}
};

//middleware function to perform offer action
//If user has available cars to swap, take the user to swap page
//Display user's available cars in the swap page
//If no available cars, then display message
var offerAction = function (req, res) {
	validateItemCode(req, res);
	if(itemCodeMatches){
		var availableItems;
		ItemModel.getItemsByStatus(req.session.theUser.userId, "available", userItemCode).then(docs => {
			availableItems = docs;
			console.log('available items: '+ availableItems.length);
		if(availableItems.length != 0){
			var item;
			ItemModel.getItem(userItemCode).then(docs => {
				item = docs;
				req.session.availableItems = availableItems;
			res.render('swap', {availableItems: req.session.availableItems, item: item});
			}).catch(err =>{
				    console.error(err);
				});
		}else{
			ItemModel.getItem(userItemCode).then(docs => {
				req.session.item = docs;
				res.render('item', {item: req.session.item, msg: "Sorry, you do not have any available items for swapping. Please add more items to start swapping again!"});
				}).catch(err =>{
					    console.error(err);
					});
		}
		}).catch(err =>{
			    console.error(err);
			});
	}
};

//middleware function to perform sign out action
//user session destroyed
//take the user to categories page
var signOutAction = function (req, res) {
	req.session.destroy();
	res.locals.loginFlag = false;
	res.locals.userFName = null;
	var categories;
	var items;
	ItemModel.getAllCategories().then(docs => {
		categories = docs;
		ItemModel.getAllItems().then(docs => {
			items = docs;
			res.render('categories', {categories, items});
		}).catch(err =>{
			    console.error(err);
			});
    }).catch(err =>{
            console.error(err);
    	});
	
};

app.get('/myItems*', function (req, res) {
	if(!req.session.theUser || req.session.theUser === undefined ){
		res.locals.loginFlag = false;
		res.locals.userFName = null;
		res.render('login', {loginMsg: "Please login to proceed."});
	}else if(req.query.action){
		res.locals.loginFlag = true;
		res.locals.userFName = req.session.theUser.firstName;

		myAction = req.query.action;
		userItemCode = req.query.itemCode;
		switch(myAction){
			case 'update':
					console.log('update action..');
					updateAction(req, res);
					break;
			case 'accept':
			case 'reject':
			case 'withdraw':
					console.log('Swap action..accept/reject/withdraw..');
					swapAction(req, res);
					break;
			case 'delete':
					console.log('Delete action..');
					deleteAction(req, res);
					break;
			case 'offer':
					console.log('Offer action..');
					offerAction(req, res);
					break;
			case 'signOut':
					console.log('Sign Out action..');
					signOutAction(req, res);
					break;
			default:
				res.render('myItems', {userProfile: req.session.currentProfile});
		}
	}else{
		res.locals.loginFlag = true;
		res.locals.userFName = req.session.theUser.firstName;
		res.render('myItems', {userProfile: req.session.currentProfile});
	}
});

app.get('/mySwaps*', function (req, res) {
	if(!req.session.theUser || req.session.theUser == undefined ){
		res.locals.loginFlag = false;
		res.locals.userFName = null;
		res.render('login', {loginMsg: "Please login to proceed."});
	}else{
		res.locals.loginFlag = true;
		res.locals.userFName = req.session.theUser.firstName;
		var userOfferItems;
			OfferModel.getUserOffersByStatus(req.session.theUser.userId, "pending").then(docs => {
				userOfferItems = docs;
				console.log('No of items for offer: '+userOfferItems.length);
				res.render('mySwaps', {offerItems: userOfferItems});
			}).catch(err =>{
			        console.error(err);
			    });
	}		
});

app.post('/signIn', urlencodedParser, function (req, res) {
	var userInput = req.body;

	//validate user input
	//email - valid email
	//password - minimum 6 characters and alphanumeric
	req.assert('email', 'Enter a valid email.').isEmail();
	req.assert('password', 'Enter a valid alphanumeric password of length minimum 6 characters.').isLength({min:6}).isAlphanumeric();

	var errors = req.validationErrors();
	if(errors){
		console.log('Email or password is invalid');
		res.locals.loginFlag = false;
		res.locals.userFName = null;
		res.render('login', {loginMsg: errors[0].msg});
	}else{
		UserModel.getUserByEmail(userInput.email, userInput.password).then(docs => {
			if(!docs[0] || docs[0] == undefined ){
				res.locals.loginFlag = false;
				res.locals.userFName = null;
				res.render('login', {loginMsg: "Email or password is incorrect! Please try again."});
			}else{
				res.locals.loginFlag = true;
				user = docs[0].toObject();
				req.session.theUser = user;
				res.locals.userFName = req.session.theUser.firstName;

				ItemModel.getUserItems(req.session.theUser.userId).then(docs => {
					userProf = new UserProfile(req.session.theUser.userId, docs);
					req.session.currentProfile = userProf;
					res.render('myItems', {userProfile: req.session.currentProfile});
				}).catch(err =>{
					    console.error(err);
					});
			}
		}).catch(err =>{
		        console.error(err);
		    });
	}
});

app.post('/register', urlencodedParser, function (req, res) {
	var userDetails = req.body;
	UserModel.addUser(userDetails.password, userDetails.firstName, userDetails.lastName, userDetails.email, 
		userDetails.address1, userDetails.address2, userDetails.city, userDetails.state, userDetails.postcode, 
		userDetails.country).then(docs => {
			console.log("DOCS in add user:"+ docs);
			if (!docs || docs == undefined) {
				res.locals.loginFlag = false;
				res.locals.userFName = null;
				res.render('register', {registerMsg: "Something went wrong! Please try again."});
			}else{
				res.locals.loginFlag = false;
				res.locals.userFName = null;
				res.render('login', {loginMsg: "registerSuccess"});
			}
		}).catch(err =>{
		        console.error(err);
		    });
});

app.get('/rating*', function (req, res) {
	if(!req.session.theUser || req.session.theUser == undefined ){
		res.locals.loginFlag = false;
		res.locals.userFName = null;
		res.render('login', {loginMsg: "Please login to proceed."});
	}else{
		res.locals.loginFlag = true;
		res.locals.userFName = req.session.theUser.firstName;
		var rateItemCode = req.query.itemCode;
		ItemModel.getItem(rateItemCode).then(docs => {
			req.session.rateItem = docs;
			res.render('rating', {item: req.session.rateItem});
			}).catch(err =>{
				    console.error(err);
				});
	}		
});

