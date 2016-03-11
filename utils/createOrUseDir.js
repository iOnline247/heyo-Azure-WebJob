const fs = require('fs');
const Promise = require('bluebird');

module.exports = function (path) {
	return new Promise(function(resolve, reject) {
		try {
			fs.mkdirSync(path);
			resolve(path);
		} catch(e) {
			if ( e.code !== 'EEXIST' ) {
				reject(e);
			} else {
				resolve(path);
			}
		}
	});
};