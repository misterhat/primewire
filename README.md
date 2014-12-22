# primewire
Scrapes streaming links from PrimeWire.

## Installation
    $ npm install primewire

## Examples
```javascript
var primewire = require('primewire');

function display(err, links, id) {
    if (err) {
        return console.error(err.stack);
    }

    console.log('%d total links found for "%s".', links.length, id);
    console.log('Watch now at ' + links[0]);
}

primewire({
    title: 'The Simpsons',
    year: 1989,
    season: 1,
    episode: 2
}, display);

// Using an ID instead of title/year will result in less page load time.
primewire({
    id: '4131', // http://www.primewire.ag/watch-4131-The-Simpsons
    season: 1,
    episode: 4
}, display);

primewire({
    title: 'Saw',
    year: 2004
}, display);

primewire({
    id: '1672' // http://www.primewire.ag/watch-1672-Saw-II
}, display);
```

## API
### primewire(show, [options], callback)
Grab all associated links (not including advertisements) for a specific
movie or TV episode.


If `show` is an object it is expected to have the following properties:

```javascript
{
    // This field is optional. By default we assume movies unless season and/or
    // episode is set.
    section: 'movies' || 'tv',

    // You may specify either an id, title or title AND year.
    id: String,
    title: String,
    year: Number,

    // If searching for a TV episode, specify these fields. Both default to
    // 1 if section is 'tv'.
    season: Number,
    episode: Number
}
```

Otherwise `show` is assumed to be a title.

`options` is an optional object. If passed it's expected to have the `host`
and/or `needle` properties. `host` is a string describing which website to
scrape from (by default it's `"http://primewire.ag"`) and `needle` is an
object passed into each `needle` request.

`callback` returns an array of links for the specified show as the first
argument, and the show `id` as the second.

## License
MIT
