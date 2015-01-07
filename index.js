var qs = require('querystring'),

    cheerio = require('cheerio'),
    needle = require('needle');

// Get each third-party playback links excluding advertisements.
function getLinks(show, options, done) {
    var id, url;

    if (show.hasOwnProperty('id')) {
        id = show.id;
    } else {
        id = show;
    }

    url = options.host;

    if (show.season && show.episode) {
        url +=
            '/tv-' + id + '-X/season-' + show.season + '-episode-' +
            show.episode;
    } else {
        url += '/watch-' + id + '-X';
    }

    needle.get(url, options.needle, function (err, res, body) {
        var $, links;

        if (err) {
            return done(err);
        }

        try {
            $ = cheerio.load(body);
        } catch (e) {
            return done(e);
        }

        links = [];

        $('.movie_version a[href^="/external"]').each(function () {
            var url;

            // Ignore advertisement links.
            if ($(this).attr('data-track-cat')) {
                return;
            }

            url = $(this).attr('href');
            url = url.slice(url.indexOf('?') + 1);
            url = qs.parse(url).url;
            url = new Buffer(url, 'base64').toString();

            links.push(url);
        });

        done(null, links);
    });
}

function search(terms, options, done) {
    needle.get(options.host + '?' + qs.encode({
        'search_keywords': terms.title,
        'search_section': terms.section === 'tv' ? 2 : 1,
        key: '',
        year: terms.year,
        page: 1
    }), options.needle, function (err, res, body) {
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

            // Slice off "Watch " and "(XXXX)".
            title = title.slice(6, -7);

            shows.push({ id: id, title: title, year: year });
        });

        done(null, shows);
    });
}

// A convenience method that will automatically search and return links
// directly.
function quickLinks(show, options, done) {
    var id, section, title, year, season, episode;

    if (!done) {
        done = options;
        options = { needle: {} };
    }

    options.host = options.host || 'http://www.primewire.ag';

    // If only the ID is set, assume this is a movie and delegate to getLinks
    // directly.
    id = show.id;

    section = show.section;

    if (!section) {
        if (!show.season && !show.episode)  {
            section = 'movies';
        } else {
            section = 'tv';
        }
    }

    if (section === 'tv') {
        season = show.season || 1;
        episode = show.episode || 1;
    }

    if (id && section === 'movies') {
        return getLinks(show, options, function (err, links) {
            if (err) {
                return done(err);
            }

            done(null, links, show.id);
        });
    } else if (id && section === 'tv') {
        return getLinks({
            id: show.id,
            season: season,
            episode: episode
        }, options, function (err, links) {
            if (err) {
                return done(err);
            }

            done(null, links, show.id);
        });
    }

    if (typeof show === 'string') {
        title = show;
    } else {
        title = show.title || '';
        year = show.year;
    }

    title = title.toLowerCase();

    search({
        section: section,
        title: title,
        year: year
    }, options, function (err, shows) {
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
        }, options, function (err, links) {
            done(null, links, found.id);
        });
    });
}

module.exports = quickLinks;
