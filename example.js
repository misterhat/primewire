var primewire = require('./');

primewire.search('movies', 'texas chainsaw', function (err, movies) {
    if (err) {
        return console.error(err);
    }

    if (!movies) {
        return console.log('No movies were found!');
    }

    movies.forEach(function (movie) {
        primewire.links(movie.id, function (err, links) {
            if (err) {
                return console.error(err);
            }

            console.log('%s (%d)', movie.title, movie.year);
            console.log('%d total links found!', links.length);
            console.log('Watch now at: ' + links[0] + '\n');
        });
    });
});
