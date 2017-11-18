const mongoose = require('mongoose');
mongoose.Promise = Promise;


SpotifyAuthSchema = new mongoose.Schema({
    id: Number,
    username: {
        type:    String,
        index:   true,
        default: 'nohr12',
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    createdAt: {
        type:    Date,
        default: Date.now,
        expires: 3550 // slightly below spotify
    }
});

SpotifyAuthSchema.statics.findAndis = function findAndis(cb) {
  return this.where({ username: 'nohr12' }).limit(1).exec(cb);
}


let SpotifyAuth = mongoose.model('SpotifyAuth', SpotifyAuthSchema);

module.exports = SpotifyAuth;