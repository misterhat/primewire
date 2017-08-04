var qs = require('querystring'),

    cheerio = require('cheerio'),
    get = require('simple-get'),
    findEpisode = require('episode');

module.exports.host = 'http://primewire.ag';

// get each third-party playback links excluding advertisements
function getLinks(show, done) {
    var url = exports.host,
        id;

    if (show.hasOwnProperty('id')) {
        id = show.id;
    } else {
        id = show;
    }

    if (show.season && show.episode) {
        url += '/tv-' + id + '-X/season-' + show.season + '-episode-' +
               show.episode;
    } else {
        url += '/watch-' + id + '-X';
    }

    get.concat(url, function (err, res, body) {
        var $, links;

        if (err) {
            return done(err);
        }

        try {
            $ = cheerio.load(body.toString());
        } catch (e) {
            return done(e);
        }

        links = [];

        $('.movie_version').each(function () {
            var label = $(this).find('.version_host script').html(),
                url;

            // ignore advertisement links
            if (/Promo|Sponsor/.test(label)) {
                return;
            }

            url = $(this).find('a[href^="/gohere.php"]').attr('href');
            url = url.slice(url.indexOf('?') + 1);
            url = qs.parse(url).url;
            url = new Buffer(url, 'base64').toString();

            links.push(url);
        });

        done(null, links);
    });
}

// find the latest episode of a series
function getLatest(series, distance, done) {
    var url, id, terms;

    if (!done) {
        done = distance;
        distance = 1;
    }

    if (series.hasOwnProperty('id')) {
        id = series.id;
    } else if (series.hasOwnProperty('title')) {
        terms = { title: series.title };

        if (series.hasOwnProperty('year')) {
            terms.year = series.year;
        }

        return search(terms, function (err, shows) {
            if (err) {
                return done(err);
            }

            if (!shows.length) {
                return done();
            }

            getLatest(shows[0].id, distance, done);
        });
    } else {
        id = series;
    }

    url = exports.host + '/watch-' + id + '-X-online-free';

    get.concat(url, function (err, res, body) {
        var $, episode, match;

        if (err) {
            return done(err);
        }

        try {
            $ = cheerio.load(body);
        } catch (e) {
            return done(e);
        }

        episode = $('.tv_episode_item a').get();
        episode = episode[episode.length - distance];

        if (!episode || !episode.attribs || !episode.attribs.href) {
            return done(new Error('show not found'));
        }

        episode = episode.attribs.href;
        match = episode.match(/\/season-(\d+)-episode-(\d+)/);

        if (!match) {
            return done(new Error('no latest season/episode found'));
        }

        getLinks({
            id: id,
            season: match[1],
            episode: match[2]
        }, done);
    });
}

// search for movies and TV shows based on terms, and return the title, year
// and id for each
function search(terms, done) {
    get.concat(exports.host + '?' + qs.encode({
        'search_keywords': terms.title,
        'search_section': terms.section === 'tv' ? 2 : 1,
        key: '',
        year: terms.year,
        page: 1
    }), function (err, res, body) {
        var $, shows;

        if (err) {
            return done(err);
        }

        try {
            $ = cheerio.load(body);
        } catch (e) {
            return done(e);
        }

        shows = [];

        $('.index_item > a').each(function () {
            var title = $(this).attr('title'),
                id = $(this).attr('href'),
                year;

            id = id.match(/\d+/g);
            id = id ? id[0] : null;

            year = title.match(/\((\d+)\)/);
            year = year ? +year[1] : null;

            // slice off "Watch " and "(XXXX)"
            title = title.slice(6, -7);

            shows.push({ id: id, title: title, year: year });
        });

        done(null, shows);
    });
}

// a convenience method that will automatically search and return links
// directly
function quickLinks(show, done) {
    var section, season, episode, title, year, found;

    section = 'movie';

    if (show.section === 'tv' || (show.season && show.episode)) {
        section = 'tv';

        season = show.season || 1;
        episode = show.episode || 1;

        if (show.id) {
            return getLinks({
                id: show.id,
                season: season,
                episode: episode
            }, function (err, links) {
                if (err) {
                    return done(err);
                }

                done(null, links, show.id);
            });
        }
    } else {
        if (show.id) {
            return getLinks(show.id, function (err, links) {
                if (err) {
                    return done(err);
                }

                done(null, links, show.id);
            });
        }
    }

    if (typeof show === 'string') {
        title = show;
    } else {
        title = show.title || '';
        year = show.year;
    }

    title = title.toLowerCase();

    if (!season || !episode) {
        found = findEpisode(title);

        if (found) {
            section = 'tv';
            title = title.replace(new RegExp(found.matches.join('|'), 'g'), '');
            title = title.trim();
            season = found.season;
            episode = found.episode;
        }
    }

    search({
        section: section,
        title: title,
        year: year
    }, function (err, shows) {
        var found;

        if (err) {
            return done(err);
        }

        found = shows[0];

        if (!found) {
            return done(null, []);
        }

        getLinks({
            id: found.id,
            season: season,
            episode: episode
        }, function (err, links) {
            done(err, links, found.id);
        });
    });
}

module.exports = quickLinks;
module.exports.latest = getLatest;
