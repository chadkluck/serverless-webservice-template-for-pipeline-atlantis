import Utils from '../utils/index.js';

import GamesUtils from '../controllers/games.utils.js';

import * as fs from 'fs';

import { expect, use } from "chai"; // 4.x pinned in package.json because 5.x doesn't work for node require
import chaiHttp from "chai-http";

const chai = use(chaiHttp);

// https://www.sitepoint.com/delay-sleep-pause-wait/
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
};

// https://stackoverflow.com/questions/9609393/catching-console-log-in-node-js
function hook_stream (_stream, fn) {
	// Reference default write method
	var old_write = _stream.write;
	// _stream now write with our shiny function
	_stream.write = fn;

	return function() {
		// reset to the default write method
		_stream.write = old_write;
	};
};

console.log(`Testing Against Node version ${Utils.tools.nodeVerMajor} (${Utils.tools.nodeVer})`);
if (Utils.tools.nodeVerMajor < 16) {
	console.log("Node version is too low, skipping tests");
	process.exit(0);
}
if (Utils.tools.nodeVerMajor < 18) {
	console.warn("Lambda running Node v16 or less will use AWS-SDK v2. Upgrade your Lambda function to use Node v18 or higher so that AWS-SDK v3 may be used. @chadkluck/cache-data will still work under Node 16/AWS-SDK v2, but you will receive warnings about upgrading AWS-SDK to v3");
}

console.log(`Node ${Utils.tools.AWS.NODE_VER} MAJOR ${Utils.tools.AWS.NODE_VER_MAJOR} MINOR ${Utils.tools.AWS.NODE_VER_MINOR} PATCH ${Utils.tools.AWS.NODE_VER_PATCH} MAJOR MINOR ${Utils.tools.AWS.NODE_VER_MAJOR_MINOR} SDK ${Utils.tools.AWS.SDK_VER} REGION ${Utils.tools.AWS.REGION} V2 ${Utils.tools.AWS.SDK_V2} V3 ${Utils.tools.AWS.SDK_V3}`, Utils.tools.AWS.nodeVersionArray);
console.log(`Utils.tools.AWS.INFO`, Utils.tools.AWS.INFO);

/* ****************************************************************************
 *	Connection, Connections and ConnectionAuthentication Classes
 */

describe("Test Connection, Connections, and ConnectionAuthentication Classes", () => {
	describe("Test Connection Class", () => {
		it('toString with defaults', () => {
			let conn = new Utils.tools.Connection({
				host: 'api.chadkluck.net',
				path: '/games/'
			})

			expect(conn.toString()).to.equal("null null null://api.chadkluck.net/games/")
	
		})
	})
})


/* ****************************************************************************
 *	Utils
 */

describe("Test Utils", () => {

	describe('Test Request', () => {
		it('Pass event and context to Request', () => {
			// sample lambda event object
			const event = {
				"resource": "/",
				"path": "/",
				"httpMethod": "GET",
				"headers": {
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
					"Accept-Encoding": "gzip, deflate, sdch, br",
					"Accept-Language": "en-US,en;q=0.8",
					"CloudFront-Forwarded-Proto": "https",
					"CloudFront-Is-Desktop-Viewer": "true",
					"CloudFront-Is-Mobile-Viewer": "false",
					"CloudFront-Is-SmartTV-Viewer": "false",
					"CloudFront-Is-Tablet-Viewer": "false",
					"CloudFront-Viewer-Country": "US",
					"Host": "1234.cloudfront.net (prod)",
					"Upgrade-Insecure-Requests": "1",
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari"
				},
				"Via": "1.1 dce3dd2c231c926d3543b05d5c57bc3.cloudfront.net (CloudFront)",
				"X-Amz-Cf-Id": "nBs3FwS3bP0Sa1Yx8Mk= (copy)",
				"X-Forwarded-For": "192.168.1.10, 127.0.0.1",
				"X-Forwarded-Port": "443",
				"X-Forwarded-Proto": "https"
			};

			// sample lambda context object
			const context = {
				"invokedFunctionArn": "",
					"memoryLimitInMB": "128",
					"awsRequestId": "request-id",
					"functionName": "function-name",
					"functionVersion": "1.0",
					"getRemainingTimeInMillis": () => 10000,
					"invokeid": "invoke-id",
					"logGroupName": "log-group-name",
					"logStreamName": "log-stream-name",
					"done": () => {},
					"succeed": () => {},
					"fail": () => {}
			};

			expect(new Utils.Request(event, context)).to.be.an('object');

		})

	});
});

describe("Test Games", () => {

	const GamesData = JSON.parse(fs.readFileSync('./test/data/games.test.data.json'));

	describe('Search Games', () => {
		it('Found game', () => {
			expect(GamesUtils.getIndexOfGame("Chess", GamesData)).to.equal(7);
		})
		it('Found hidden game', () => {
			expect(GamesUtils.getIndexOfGame("Tic-Tac-Toe", GamesData)).to.equal(-1);
		})
		it('Game not found', () => {
			expect(GamesUtils.getIndexOfGame("Monopoly", GamesData)).to.equal(0);
		})
	})

	describe('Get Game', () => {
		it('Get game by index', () => {
			expect(GamesUtils.selectedGame(7, GamesData)).to.equal("Chess");
		})
		it('Get hidden game by index', () => {
			expect(GamesUtils.selectedGame(-1, GamesData)).to.equal("Tic-Tac-Toe");
		})
		it('Game not found', () => {
			expect(GamesUtils.selectedGame(22, GamesData)).to.be.null;
		})
	})
});
