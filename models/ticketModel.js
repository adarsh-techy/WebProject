const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ticketSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event:{
        type: Schema.Types.ObjectId,
        ref: 'Concert',
        required: true
    },
    purchaseDate:{
        type: Date,
        default: Date.now
    },
    quantity:{
        type: Number,
        required: true
    },
    totalPrice:{
        type: Number,
        required: true
    },
});

module.exports = mongoose.model('Ticket', ticketSchema);