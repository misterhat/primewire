#!/usr/bin/env node

var primewire = require('./'),
    minimist = require('minimist'),

    package = require('./package');

var argv = minimist(process.argv.slice(2)),

    version = argv.v || argv.version,
    help = argv.h || argv.help,
    title = argv._.join(' '),
    year = +(argv.y || argv.year) || undefined,
    season = +(argv.s || argv.season) || undefined,
    episode = +(argv.e || argv.episode) || undefined,
    latest = +(argv.l || argv.latest) || 1;

if (version) {
    return console.log(package.version);
} else if (!title || help) {
    console.log('usage: primewire [-hvysel] <search>');
    console.log('  -h, --help\tDisplay this screen.');
    console.log('  -v, --version\tDisplay package version.');
    console.log('  -y, --year\tYear of series or movie. Optional.');
    console.log('  -s, --season\tSeason of series. Optional.');
    console.log('  -e, --episode\tEpisode on of series. Optional.');
    console.log('  -l, --latest\tFetch latest episode of a series. Optional.');
    console.log();
    console.log('<search> is a title of series or movie.');
    return;
}

function done(err, links) {
    if (err) {
        console.error(err.stack);
        return process.exit(1);
    }

    console.log(links.join('\n'));
}

if (latest) {
    return primewire.latest({
        title: title,
        year: year
    }, latest, done);
}

primewire({
    title: title,
    year: year,
    season: season,
    episode: episode
}, done);
