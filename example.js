var primewire = require('./');

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
