# primewire
Scrapes streaming links from PrimeWire.

## Installation
For the command-line program:

    $ sudo npm install -g primewire

For the module:

    $ npm install --save primewire

## Usage
```
usage: primewire [-hvysel] <search>
  -h, --help    Display this screen.
  -v, --version Display package version.
  -y, --year    Year of series or movie. Optional.
  -s, --season  Season of series. Optional.
  -e, --episode Episode on of series. Optional.
  -l, --latest  Fetch latest episode of a series. Optional.

<search> is a title of series or movie.
```

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
### primewire.host
The base host to scrape from. Default: `"http://primewire.ag"`.

### primewire(show, callback)
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

`callback` returns an array of links for the specified show as the first
argument, and the show `id` as the second.

### primewire.latest(series, [distance], callback)
Fetch the nth distance latest episode links of a TV series.

`series` can be either a series ID (string or Number), or object containing
`title` and/or `year` properties.

`distance` is the nth laest episode to fetch. Default: 1

`callback` returns the same result as above.

## License
Copyright (C) 2016 Mister Hat

This library is free software; you can redistribute it and/or modify it under
the terms of the GNU Lesser General Public License as published by the Free
Software Foundation; either version 3.0 of the License, or (at your option) any
later version.

This library is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more details.
