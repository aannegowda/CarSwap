var UserProfile = require('../models/UserProfile');
var ItemModel = require('../models/ItemDB');
var HashPassword = require('../Utility/HashPassword');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nbadDB', { useNewUrlParser: true });

var Schema = mongoose.Schema;

var usersSchema = new Schema({
    userId: {type: String, required: true},
	password: {type: String, required: true},
    salt: String,
	firstName: String, 
	lastName: String, 
	emailAddress: String, 
	addressField1: String, 
	addressField2: String,
	city: String, 
	state: String, 
	postCode: String, 
	country: String
}, {collection: 'users'});

const User = mongoose.model('User', usersSchema);

module.exports.Users = User;

//Registration functionality
//Adds new user to the users collection
//userId is autogenerated - unique Id
//Password is hashed before storing
//Salt is also stored in the databse
module.exports.addUser = function (password, firstName, lastName, emailAddress, addressField1, addressField2, city, state, postCode, country) {
    var passwordData = HashPassword.saltHashPassword(password);
    return new Promise((resolve, reject) => {
        var newUser = new User({
            userId: getUniqId(),
            password: passwordData.passwordHash,
            salt: passwordData.salt,
            firstName: firstName,
            lastName: lastName,
            emailAddress: emailAddress,
            addressField1: addressField1,
            addressField2: addressField2,
            city: city,
            state: state,
            postCode: postCode,
            country: country
        });
        newUser.save().then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//generates unique userId
var getUniqId = function () {
  return Math.random().toString(36).substr(2, 9);
};

//gets all the users in users collection
module.exports.getAllUsers = function () {
    return new Promise((resolve, reject) => {
        User.find().then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//gets all the details of user from users collection
module.exports.getUser = function (userId) {
    return new Promise((resolve, reject) => {
        User.find({userId: userId}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//sign in functionality
//validates the user's email and the hashed password before allowing to sign in
module.exports.getUserByEmail = function (email, pwd) {
    return new Promise((resolve, reject) => {
        User.find({emailAddress: email}).then(docs =>{
           if (!docs[0] || docs[0] == undefined) {
                resolve(docs);
           }else{
                var dbPwd = docs[0]._doc.password;
                var salt = docs[0]._doc.salt;
                var hashedPwdData = HashPassword.validateHash(pwd, salt);
                if (dbPwd === hashedPwdData.passwordHash) {
                    User.find({$and: [{emailAddress: email}, {password: hashedPwdData.passwordHash}]}).then(docs =>{
                        resolve(docs);
                    }).catch(err => {
                        return reject(err);
                    });
                }else{
                    docs[0] = undefined;
                    resolve(docs);
                }
           }
        }).catch(err => {
            console.error(err);
        });
    });
};
