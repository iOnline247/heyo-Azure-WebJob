'use strict';
const settings = require('./config/secrets');
const path = require('path');
const restartJobInSeconds = 100;
const LOG_FILE_MAX_SIZE = 100 * 1024 * 1024; // MBs.
const MAX_NUM_OF_LOG_FILES = 10; // 10 * 100 MBs = 1 GB.
const logDirectory = (process.env.WEBROOT_PATH) ?
	path.join(process.env.WEBROOT_PATH, 'logs') :
	'logs';

// DB
const db = require('monk')(settings.mongo.conn);
const users = db.get('users');
/*
// Tenative user schema
{
	access_token: string,
	access_token_secret: string,
	request_token: string,
	user_id: string,
	phone_number: string, // xxx-xxx-xxxx
	memes: Array
	messages: Array
}
*/

// Utils
const Promise = require('bluebird');
const _ = require('lodash');
const winston = require('winston');
const logger = new (winston.Logger)({
	transports: [
		new (winston.transports.File)({
			name: 'default',
			filename: path.join(logDirectory, 'web-job.log'),
			level: 'info',
			logstash: true,
			maxsize: LOG_FILE_MAX_SIZE,
			maxFiles: MAX_NUM_OF_LOG_FILES,
			tailable: true
		}),
		new (winston.transports.File)({
			name: 'error-file',
			filename: path.join(logDirectory, 'web-job.log'),
			level: 'error',
			logstash: true,
			maxsize: LOG_FILE_MAX_SIZE,
			maxFiles: MAX_NUM_OF_LOG_FILES,
			tailable: true
		})
	]
});
const cuid = require('cuid');


function init() {
	main()
		.catch(function() {
			// TODO:
			// Handle error within main.
			debugger;
		})
		.finally(function() {
			setTimeout(init, restartJobInSeconds);
		});
}

function main() {
	const logId = cuid();
	return new Promise(function(resolve, reject) {
		logger.info('Hello world!', {logId: logId});
		logger.info('main() invoked', {logId: logId});
		resolve();
	});
}

init();



// Catch unhandled errors
process.on('uncaughtException', function (err) {
	let message = '\n' + (new Date).toUTCString() + ' uncaughtException: ' + err.message;
	
	message += '\n\n' + err.stack;
	logger.error(message, {logId: cuid()});
});