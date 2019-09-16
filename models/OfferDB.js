//mongoose
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nbadDB', { useNewUrlParser: true });

var Schema = mongoose.Schema;

var offersSchema = new Schema({
    offerId: {type: String, required: true},
    userId: String,
    itemCodeOwn: String,
    itemCodeOwnName: String,
    itemCodeWant: String,
    itemCodeWantName: String,
    itemUserId: String,
    offerStatus: String
}, {collection: 'offers'});

const Offer = mongoose.model('Offer', offersSchema);

module.exports.Offers = Offer;

module.exports.addOffer = function (userId, itemCodeOwn, itemCodeOwnName, itemCodeWant, itemCodeWantName, itemUserId, itemStatus) {
    return new Promise((resolve, reject) => {
        var newOffer = new Offer({
            offerId: getUniqId(),
            userId: userId,
            itemCodeOwn: itemCodeOwn,
            itemCodeOwnName: itemCodeOwnName,
            itemCodeWant: itemCodeWant,
            itemCodeWantName: itemCodeWantName,
            itemUserId: itemUserId,
            itemStatus: itemStatus
        });
        newOffer.save().then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        })
    });
};

//Update offer table status
module.exports.updateOfferStatus = function (itemCode, itemStatus) {
    Offer.findOneAndUpdate({itemCodeOwn: itemCode}, {$set:{offerStatus: itemStatus}}, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
    });
};

//delete an offer from offers collection
module.exports.deleteOffer = function (itemCodeOwn) {
    Offer.find({itemCodeOwn: itemCodeOwn}).remove().exec();
};

//get item corresponding to a particular offer status
module.exports.getItemsWithStatus = function (userId, status) {
    return new Promise((resolve, reject) => {
        Offer.find({$and: [{userId: userId}, {itemStatus: status}]}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//get status of an offer
module.exports.getOfferStatus = function (itemCode) {
    return new Promise((resolve, reject) => {
        Offer.findOne({$or: [{itemCodeOwn: itemCode}, {itemCodeWant: itemCode}]}, {offerStatus: 1}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//get details of an offer
module.exports.getOfferDetails = function (itemCode) {
    return new Promise((resolve, reject) => {
        Offer.find({$or: [{itemCodeOwn: itemCode}, {itemCodeWant: itemCode}]}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//get the particular user offers based on userId and offerStatus
module.exports.getUserOffersByStatus = function (userId,offerStatus) {
    return new Promise((resolve, reject) => {
        Offer.find({$and: [{userId: userId}, {offerStatus: offerStatus}]}).then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        });
    });
};

//generate unique offer Id
var getUniqId = function () {
  return Math.random().toString(36).substr(2, 9);
};


