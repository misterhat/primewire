var primewire = require('primewire');
var sys = require('sys')
var exec = require('child_process').exec;
var args = process.argv.slice(2);

function display(err, links, id) {
	exec('open ' + links[0]);
}

primewire({
	title: args[0],
	season: args[1],
	episode: args[2]
}, display);
