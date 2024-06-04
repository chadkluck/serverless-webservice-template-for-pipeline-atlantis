/* 
*******************************************************************************
Serverless API Web Service with Internal Cache
*******************************************************************************

Version: 2.0.0-20240603-1600
Author: Chad Leigh Kluck, chadkluck.me
GitHub: https://github.com/chadkluck

-------------------------------------------------------------------------------

This is a template for an AWS Lambda function that provides an api service
via API Gateway. Internal caching utilizes DynamoDb and S3 through the
npm package @chadkluck/cache-data .

-------------------------------------------------------------------------------

For other notes and info, refer to README.md

*******************************************************************************
*/

"use strict";

const Utils = require("./utils/index.js");
const { Config } = require("./config/index.js");
const Routes = require("./routes/index.js");

/* log a cold start and keep track of init time */
const coldStartInitTimer = new Utils.Timer("coldStartTimer", true);

/* initialize the Config */
Config.init(); // we need to await completion in the async call function - at least until node 14

/**
 * Lambda function handler
 * 
 * @param {object} event Lambda event - doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {object} context Lambda context - doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {object} callback Callback function to submit response
 */
exports.handler = async (event, context, callback) => {

	let response = null;

	try {

		/* wait for CONFIG to be settled as we need it before continuing. */
		await Config.promise();
		await Config.prime();

		/* If the cold start init timer is running, stop it and log. This won't run again until next cold start */
		if (coldStartInitTimer.isRunning()) { Utils.DebugAndLog.log(coldStartInitTimer.stop(),"COLDSTART"); }

		/* Process the request and wait for result */
		response = await Routes.process(event, context);

	} catch (error) {

		/* Log the error */
		Utils.DebugAndLog.error(`500 | Unhandled Execution Error in Handler ${error.message}`, JSON.stringify(error.stack));

		response = {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Error initializing request - 1701-D' // 1701-D just so we know it is an app and not API Gateway error
			}),
			headers: {'content-type': 'application/json'}
		};

	} finally {

		/* Send the result back to API Gateway */
		callback(null, response);

	}

};