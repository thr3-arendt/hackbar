module.exports = function (app) {

    // home page
    app.get('/', function (req, res) {
        res.render('index', { title:''})
    });

    // chat area
    app.get('/chat', function (req, res) {
        res.render('chat', { title: 'Chat with Me!  ' })
    });

    // about page
    app.get('/about', function (req, res) {
        res.render('about', { title: 'About Me.  ' })
    });

    // queue
    app.get('/queue', function (req, res) {
        res.render('player/queue')
    });
}
