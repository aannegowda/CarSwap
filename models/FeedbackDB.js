var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nbadDB', { useNewUrlParser: true });

var Schema = mongoose.Schema;

var offerFeedbackSchema = new Schema({
    offerId: {type: String, required: true},
    userId1: {type: String, required: true},
    userId2: String,
    rating: Number
}, {collection: 'offerFeedbacks'});

const OfferFeedback = mongoose.model('OfferFeedback', offerFeedbackSchema);

module.exports.OfferFeedbacks = OfferFeedback;

//Add new offer(user) feedback provided to offerFeedback collection
module.exports.addOfferFeedback = function (offerId, userId1, userId2, rating) {
    return new Promise((resolve, reject) => {
        var newFeedback = new OfferFeedback({
            offerId: offerId,
            userId1: userId1,
            userId2: userId2,
            rating: rating
        });
        newFeedback.save().then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        })
    });
};

var itemFeedbackSchema = new Schema({
    itemCode: {type: String, required: true},
    userId: {type: String, required: true},
    rating: Number
}, {collection: 'itemFeedbacks'});

const ItemFeedback = mongoose.model('OfferFeedback', itemFeedbackSchema);

module.exports.ItemFeedbacks = ItemFeedback;

//Add new item feedback provided to itemFeedback collection
module.exports.addItemFeedback = function (itemCode, userId, rating) {
    return new Promise((resolve, reject) => {
        var newFeedback = new ItemFeedback({
            itemCode: itemCode,
            userId: userId,
            rating: rating
        });
        newFeedback.save().then(docs =>{
            resolve(docs);
        }).catch(err => {
            return reject(err);
        })
    });
};
