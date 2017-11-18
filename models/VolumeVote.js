const mongoose = require('mongoose');
mongoose.Promise = Promise;

let volumeVoteSchema = new mongoose.Schema({
  id: Number,
  vote: {
    type:    Boolean, // false = reduce, true = increase, null = no optinion / perfect
    default: null,
  },
  date: {
    type: Date,
    index: true,
    default: Date.now
  },
});

// count booleans, https://stackoverflow.com/questions/17195844/how-to-count-booleans-in-mongodb-with-aggregation-framework

let VolumeVote = mongoose.model('VolumeVote', volumeVoteSchema);

module.exports = VolumeVote;