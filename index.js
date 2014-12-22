var qs = require('querystring'),

    cheerio = require('cheerio'),
    needle = require('needle');

var search;

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

// Search is protected with a CSRF key for some reason.
function getKey(options, done) {
    needle.get(options.host, options.needle, function (err, res, body) {
        var $, key;

        if (err) {
            return done(err);
        }

        try {
            $ = cheerio.load(body);
        } catch (e) {
            return done(e);
        }

        key = $('input[name="key"]').attr('value');

        if (!key) {
            done(new Error('Could not locate search key.'));
        } else {
            done(null, key);
        }
    });
}

search = (function () {
    var key;

    return function (section, terms, options, done) {
        if (!key) {
            return getKey(options, function (err, newKey) {
                if (err) {
                    return done(err);
                }

                key = newKey;
                search(section, terms, options, done);
            });
        }

        needle.get(options.host + '?' + qs.encode({
            'search_keywords': terms,
            'search_section': section === 'tv' ? 2 : 1,
            key: key,
            page: 1
        }), options.needle, function (err, res, body) {
            var $, shows;

            if (err) {
                return done(err);
            }

            // This usually means that our CSRF session has expired, so load
            // again and retry the search.
            if (res.statusCode === 302) {
                key = undefined;

                return search(section, terms, options, done);
            }

            shows = [];

            try {
                $ = cheerio.load(body);
            } catch (e) {
                return done(e);
            }

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
    };
}());

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

    search(section, title, options, function (err, shows) {
        var found, i;

        if (err) {
            return done(err);
        }

        if (year) {
            for (i = 0; i < shows.length; i += 1) {
                if (shows[i].year === year) {
                    found = shows[i];
                    break;
                }
            }
        } else {
            found = shows[0];
        }

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
