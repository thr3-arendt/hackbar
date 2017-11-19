const mongoose = require('mongoose');
mongoose.Promise = Promise;


ActionLogSchema = new mongoose.Schema({
    id: Number,
    createdAt: {
        type:     Date,
        default:  Date.now,
        required: true,
    },
    message: {
        type:     String,
        required: true
    },
});

let ActionLog = mongoose.model('ActionLog', ActionLogSchema);

module.exports = ActionLog;