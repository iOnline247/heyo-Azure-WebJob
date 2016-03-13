'use strict';
const fs = require('fs');
const path = require('path');
const restartJobInSeconds = 5 * 1000;
const LOG_FILE_MAX_SIZE = 100; // MBs.
const LOG_FILE_DIR_MAX_SIZE = 1; // GBs.
const logDirectory = 'logs';
let currentLogFileName;
let logger;

// Utils
const Promise = require('bluebird');
const _ = require('lodash');
const createOrUseDir = require('./utils/createOrUseDir');
const getFolderSize = require('get-folder-size');
const bunyan = require('bunyan');
const randomString = require('./utils/randomString');




init();

function init() {
	createOrUseDir(logDirectory)
		.then(getLogFiles)
		.then(setCurrentLogFile)
		.then(shouldTrimLogs)
		.then(main)
		.finally(function() {
			setTimeout(init, restartJobInSeconds);
		});
}

function getLogFiles(dirPath) {
	return new Promise(function(resolve, reject) {
		const files = fs.readdirSync(dirPath).map(function(v) {
			const file = fs.statSync(path.join(dirPath, v));

			return { 
				name: v,
				size: Math.floor(file.size / 1024 / 1024), // converts bytes to MB.
				time: file.mtime.getTime()
			};
		});

		resolve({
			dirPath: dirPath, 
			files: files
		});
	});
}

function setCurrentLogFile(deets) {
	// set currenLogFileName based on size of last modified log file.
	// 100 MBs is the limit per log file.

	return new Promise(function(resolve, reject) {
		const lastModifiedLogFile = deets.files.sort(function(a, b) {
			return b.time - a.time;
		})[0];

		// if less than 100 MBs, use it, else create new logFile and set currentLogFileName.
		if (lastModifiedLogFile.size >= LOG_FILE_MAX_SIZE) {
			// create new log file.
			const logFileName = 'log - ' + (new Date()).getTime() + '.log';
			currentLogFileName = path.join(logDirectory, logFileName);
		} else {
			currentLogFileName = path.join(logDirectory, lastModifiedLogFile.name);
		}
		
		logger = bunyan.createLogger({
			name: 'heyo',
			jobId: randomString(32),
			streams: [{
				path: currentLogFileName
			}]
		});
		resolve(deets);
	});
}

function shouldTrimLogs(deets) {
	return new Promise(function(resolve, reject) {
		getFolderSize(deets.dirPath, function(err, dirSize) {
			// dirSize is in GBs.
			dirSize = (dirSize / 1024 / 1024 / 1024);
			logger.info('Log directory size: ' + dirSize + ' GBs.');
			
			// Greater than 1 GB.
			if(dirSize > LOG_FILE_DIR_MAX_SIZE) {
				deletingOldestLogFile(deets.files);
			}

			resolve(deets);		
		});
	});
}

function deletingOldestLogFile(files) {
	const oldLogFile = files.sort(function(a, b) {
		return a.time - b.time;
	})[0];

	fs.unlinkSync(path.join(logDirectory, oldLogFile.name));
}

function main() {
	return new Promise(function(resolve, reject) {
		// fs.appendFileSync(currentLogFileName, logger.info('main() invoked'));
		logger.info('main() invoked');
		resolve();
	});
}