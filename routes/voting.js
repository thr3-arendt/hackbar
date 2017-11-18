module.exports = function (app) {

    const VolumeVote = require('./../models/VolumeVote');


    /**
     * Volume control
     * -------------------------------------------------------------------------------------------------
     **/
    app.get('/vote/volume', function (req, res) {
        VolumeVote.find({}).sort({ date : -1 }).lean().exec().then(votes => {
            res.render('votes/volume', { votes: votes });
        }, error => console.error('Cannot fetch volume votes', error));
    });

    app.get('/vote/volume-up', function (req, res) {
        vote = new VolumeVote();
        vote.vote = true;
        vote.save(() => res.redirect('/vote/volume'));
    });

    app.get('/vote/volume-down', function (req, res) {
        vote = new VolumeVote();
        vote.vote = false;
        vote.save(() => res.redirect('/vote/volume'));
    });

}