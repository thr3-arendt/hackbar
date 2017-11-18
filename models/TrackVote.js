const mongoose = require('mongoose');
mongoose.Promise = Promise;


TrackVotesSchema = new mongoose.Schema({
    id: Number,
    track: {
        type: String,
        index: true,
        required: true,
    },
    vote_positive: {
        type: Number,
        required: true,
        default: 0,
    },
    vote_negative: {
        type: Number,
        required: true,
        default: 0,
    },
    deleted: Boolean,
});

let TrackVotes = mongoose.model('TrackVotes', TrackVotesSchema);

module.exports = TrackVotes;