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
    episode = +(argv.e || argv.episode) || undefined;

if (version) {
    return console.log(package.version);
} else if (!title || help) {
    console.log('Usage: primewire <search> [options]');
    console.log('  -h, --help\tDisplay this screen.');
    console.log('  -v, --version\tDisplay package version.');
    console.log('  -y, --year\tYear of series or movie. Optional.');
    console.log('  -s, --season\tSeason of series. Optional.');
    console.log('  -e, --episode\tEpisode on of series. Optional.');
    return;
}

primewire({
    title: title,
    year: year,
    season: season,
    episode: episode
}, function (err, links) {
    if (err) {
        console.error(err.stack);
        return process.exit(1);
    }

    console.log(links.join('\n'));
});
