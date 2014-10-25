# primewire
Scrapes streaming links and searches from PrimeWire.

## Installation
    $ npm install primewire

## Examples
```javascript
var primewire = require('primewire');

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
```

## API
### .search(section, terms, [page], callback)
Search the specified section on PrimeWire for TV shows or movies.

`section` should be a string with the value `"movies"` or `"tv"`.

`terms` is a string containing the terms you wish to search for.

`page` is an integer describing which page to start scraping from. By default
it starts at 1.

`callback` returns two values. The first being an array of objects. Each object
has an `id`, `title` and `year` property. The second value is the amount
of remaining pages.

### .links(show, callback)
Grab all associated links (not including advertisements) for a specific
movie or TV episode.

`show` can either be a string or an object. If `show` is a string, it's presumed
to be a movie ID. Otherwise, if `show` is an object, it's assumed to have either
an `id` property, or `id`, `season` and `episode` properties.

`callback` returns an array of strings corresponding to each playback URL.

## License
MIT
