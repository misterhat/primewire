var tap = require('tap').test,

    primewire = require('./');

tap('finding links', function (test) {
    test.plan(2);

    primewire({
        title: 'the simpsons',
        season: 5,
        episode: 6
    }, function (err, links) {
        test.ok(!err && links && links.length, 'tv episode links');
    });

    primewire({
        title: 'saw',
        year: 2004
    }, function (err, links) {
        test.ok(!err && links && links.length, 'movie links');
    });
});
