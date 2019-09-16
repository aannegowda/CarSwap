//mongoose
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nbadDB', { useNewUrlParser: true });

var Schema = mongoose.Schema;

var itemsSchema = new Schema({
    itemCode: {type: String, required: true},
    itemName: String,
    catalogCategory: String,
    description: String,
    rating: Number,
    imageURL: String,
    userId: {type: String, required: true},
    itemStatus: String
}, {collection: 'items'});

const Item = mongoose.model('Item', itemsSchema);

module.exports.Items = Item;

//adds new item to items collection
//default status is set to available
module.exports.addItem = function (itemCode, itemName, catalogCategory, description, rating, imageURL, userId) {
    return new Promise((resolve, reject) => {
        var newItem = new Item({
            itemCode: itemCode,
            itemName: itemName,
            catalogCategory: catalogCategory,
            description: description,
            rating: rating,
            imageURL: imageURL,
            userId: userId,
            itemStatus: "available"
        });
        newItem.save().then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//Gets all the items from the items collection
module.exports.getAllItems = function () {
    return new Promise((resolve, reject) => {
        Item.find().then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//Gets a perticular item based on the given itemCode
module.exports.getItem = function (itemCode) {
    return new Promise((resolve, reject) => {
        Item.findOne({itemCode: itemCode}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//Gets all the distinct car categories
module.exports.getAllCategories = function () {
    return new Promise((resolve, reject) => {
        Item.find().distinct('catalogCategory').then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//fetches all items in the user's profile
module.exports.getUserItems = function (userId) {
    return new Promise((resolve, reject) => {
        Item.find({userId: userId}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//fecthes the user items of other users
module.exports.getOtherUserItems = function (userId) {
    return new Promise((resolve, reject) => {
        Item.find({userId: {$ne: userId}}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//get item based on userId, itemStatus, itemCode
//itemStatus can be available/pending/swapped
module.exports.getItemsByStatus = function (userId, itemStatus, itemCode) {
    return new Promise((resolve, reject) => {
        Item.find({$and: [{userId: userId}, {itemStatus: itemStatus}, {itemCode: {$ne:itemCode}}]}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//Update item status to available/pending/swapped based on itemCode
module.exports.updateItemStatus = function (itemCode, itemStatus) {
    Item.findOneAndUpdate({itemCode: itemCode}, {$set:{itemStatus: itemStatus}}, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
    });
};

//Delete item from items collection based on itemCode
module.exports.deleteItem = function (itemCode) {
    Item.deleteOne({ itemCode: itemCode }, function (err) {
        if (err) return handleError(err);
          console.log("Item deleted!");
    });
};

//Fecthes itemStatus based on itemCode
module.exports.getItemStatus = function (itemCode) {
    return new Promise((resolve, reject) => {
        Item.findOne({itemCode: itemCode}, {itemStatus: 1}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};