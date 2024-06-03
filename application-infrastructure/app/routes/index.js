const Utils = require("../utils");
const {Config} = require("../config");

/**
 * Process the request
 * 
 * @param {array} event The event passed to the lambda function
 * @param {array} context The context passed to the lambda function
 */
const process = async function(event, context) {

	/**
	 * Contains information about the request event
	 */
	const REQ = new Utils.Request(event);

	/**
	 * Timer used for logging execution time
	 */
	const timer = new Utils.Timer("Response timer", true);


	/* 
	*******************************************************************************
	Response Methods
	*******************************************************************************
	*/

	/**
	 * Generate an error response (execution errors)
	 * This is generated if unrecoverable errors are thrown during execution.
	 * Possible errors include inability to access DynamoDB, improper requests,
	 * or any other error that is caught, but can't result in proper execution.
	 * @param {Error} e 
	 * @param {String} statusCode 
	 * @returns {object} A final response that is an error
	 */
	const generateErrorResponse = function (e, statusCode = "400") {

		// put the error message in the body, format it to a specification
		var body = { errors: [{ code: statusCode, type: "Error", message: e.message }]};

		var contentType = "application/json";
		body = JSON.stringify(body);

		var headers = { 
			"content-type": contentType,
			"access-control-allow-origin": "*",
			"expires": (new Date(Date.now() + (process.env.errorExpiresInSeconds * 1000))).toUTCString(),
			"cache-control": "public, max-age="+process.env.errorExpiresInSeconds
		}; 

		// send the error message to the console as Utils.Log.critical bypasses any debug silencer
		logCritical(statusCode + " " + e.message);

		var response = {statusCode: statusCode, headers: headers, body: body };

		return response;
	};

	/* 
	*******************************************************************************
	Request Execution Container
	*******************************************************************************
	*/

	/* 
	===========================================================================
	processRequest() code
	*/
	
	Utils.DebugAndLog.debug("Received event", event);
	// this will hold the final response we send back to the calling handler
	let functionResponse = null;

	try {

		if (REQ.isValid()) {
			functionResponse = await execute();
		} else {
			functionResponse = generateErrorResponse(new Error("Invalid request", "403"));
		}
		
	} catch (error) {
		Utils.DebugAndLog.error("Fatal error", { message: error.message, trace: error.stack });
		functionResponse = generateErrorResponse(new Error("Application encountered an error. Twenty Two", "500"));
	}

	Utils.Log.response(functionResponse, REQ);
	return functionResponse;

};


module.exports = {
	process
};