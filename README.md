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
### primewire(show, callback)
Grab all associated links (not including advertisements) for a specific
movie or TV episode.

`show` is presumed to either be a string or an object. If `show` is a string,
it's assumed to be a movie `id` and will fetch the links for such movie.
Otherwise, if `show` is an object, it's assumed to have an `id` property, or
`title` and `year` properties.
If `show` describes a TV episode, include `season` and `episode` properties
as well.

`callback` returns an array of strings corresponding to each playback URL along
with an optional `id` value.

## License
MIT
