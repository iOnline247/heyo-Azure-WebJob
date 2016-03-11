'use strict';
const fs = require('fs');
const path = require('path');
const async = require('async');
const restartJobInSeconds = 5 * 1000;
const logDirectory = 'logs';

// Utils
const Promise = require('bluebird');
const _ = require('lodash');
const createOrUseDir = require('./utils/createOrUseDir');
const getFolderSize = require('get-folder-size');
const bunyan = require('bunyan');
const randomString = require('./utils/randomString');
const logger = bunyan.createLogger({name: 'heyo', jobId: randomString(32)});



init();

function init() {
	// console.log('Azure-WebJob runs on Node version:', process.version);
	createOrUseDir(logDirectory)
		.then(getLogFiles)
		.then(shouldTrimLogs)
		.then(main)
		.then(function() {
			setTimeout(init, restartJobInSeconds);
		});
}

function getLogFiles(dirPath) {
	return new Promise(function(resolve, reject) {
		const files = fs.readdirSync(dirPath).map(function(v) {
			return { 
				name: v,
				time: fs.statSync(path.join(dirPath, v)).mtime.getTime()
			}; 
		});

		resolve({
			dirPath: dirPath, 
			files: files
		});
	});
}
// setTimeout(init);
function shouldTrimLogs(deets) {
	return new Promise(function(resolve, reject) {
		getFolderSize(deets.dirPath, function(err, dirSize) {
			// dirSize is in GBs now.
			dirSize = (dirSize / 1024 / 1024 / 1024);
			logger.info('Log directory size: ' + dirSize + ' GBs.');

			if(dirSize > 1) {
				deletingOldestLogFile(deets.files);
			}

			resolve();		
		});
	});
}

function deletingOldestLogFile(files) {
	const oldLogFile = files.sort(function(a, b) {
		return a.time - b.time;
	})[0];

	debugger;

	// implement deletion of file.
}

function main() {
	return new Promise(function(resolve, reject) {
		logger.info('main() invoked');
		resolve();
	});
}