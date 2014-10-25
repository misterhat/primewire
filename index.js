var qs = require('querystring'),

    cheerio = require('cheerio'),
    needle = require('needle');

var HOST = 'http://www.primewire.ag',
    // Search results per page.
    PER_PAGE = 20;

var search;

// Get each third-party playback links excluding advertisements.
function getLinks(show, done) {
    var id, url;

    if (show.hasOwnProperty('id')) {
        id = show.id;
    } else {
        id = show;
    }

    url = HOST;

    if (show.season && show.episode) {
        url +=
            '/tv-' + id + '-X/season-' + show.season + '-episode-' +
            show.episode;
    } else {
        url += '/watch-' + id + '-X';
    }

    needle.get(url, function (err, res, body) {
        var $, links;

        if (err) {
            return done(err);
        }

        if (res.statusCode !== 200) {
            return done(new Error(
                'Unsuccessful status code "' + res.statusCode + '" returned.'
            ));
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
function getKey(done) {
    needle.get(HOST, function (err, res, body) {
        var $, key;

        if (err) {
            return done(err);
        }

        if (res.statusCode !== 200) {
            return done(new Error(
                'Unsuccessful status code "' + res.statusCode + '" returned.'
            ));
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

    return function (section, terms, page, done) {
        if (!done) {
            done = page;
            page = 1;
        }

        if (!key) {
            getKey(function (err, newKey) {
                if (err) {
                    return done(err);
                }

                key = newKey;
                search(section, terms, page, done);
            });

            return;
        }

        needle.get(HOST + '?' + qs.encode({
            'search_keywords': terms,
            'search_section': section === 'tv' ? 2 : 1,
            key: key,
            page: page
        }), function (err, res, body) {
            var $, shows, remaining;

            if (err) {
                return done(err);
            }

            // This usually means that our CSRF session has expired, so load
            // again and retry the search.
            if (res.statusCode === 302) {
                getKey(function (err) {
                    if (err) {
                        return done(err);
                    }

                    search(section, terms, page, done);
                });

                return;
            }

            if (res.statusCode !== 200) {
                return done(new Error(
                    'Unsuccessful status code "' + res.statusCode +
                    '" returned.'
                ));
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

            if (shows.length) {
                remaining = $('.number_movies_result').text();
                remaining = remaining.match(/\d+/g);
                remaining =
                    remaining ? Math.ceil(+remaining[0] / PER_PAGE) - page : 0;
            } else {
                remaining = 0;
            }

            done(null, shows, remaining);
        });
    };
}());

// A convenience method that will automatically search and return links
// directly.
function quickLinks(show, done) {
    var id, section, title, year, season, episode;

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
        return getLinks(show, function (err, links) {
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
        }, function (err, links) {
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

    search(section, title, function (err, shows) {
        var found, i;

        if (err) {
            return done(err);
        }

        for (i = 0; i < shows.length; i += 1) {
            if (
                shows[i].title.toLowerCase() === title &&
                (year ? shows[i].year === year : true)
            ) {
                found = shows[i];
                break;
            }
        }

        if (!found) {
            return done(null, []);
        }

        getLinks({
            id: found.id,
            season: season,
            episode: episode
        }, function (err, links) {
            return done(null, links, found.id);
        });
    });
}

module.exports = quickLinks;
