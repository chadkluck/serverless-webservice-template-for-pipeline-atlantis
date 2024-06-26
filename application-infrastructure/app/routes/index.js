const Utils = require("../utils");
const Views = require("../views");

/**
 * Process the request
 * 
 * @param {object} event The event passed to the lambda function
 * @param {object} context The context passed to the lambda function
 */
const process = async function(event, context) {

	/**
	 * Contains information about the request event
	 */
	const REQ = new Utils.Request(event, context);
	
	Utils.tools.DebugAndLog.debug("Received event", event);
	// this will hold the final response we send back to the calling handler
	let response = null;

	try {

		if (REQ.isValid()) {
			// logic for routing goes here, and pass to appropriate controller
			// use if statements or switch statements.
			REQ.logRoute("root");
			response = await Views.root(REQ); // default is main
		} else {
			response = Utils.generateErrorResponse(new Error("Invalid request", "403"));
		}

		response.headers['x-exec-ms'] = REQ.timerStop();

	} catch (error) {
		Utils.tools.DebugAndLog.error(`Fatal error: ${error.message}`, JSON.stringify(error.stack ));
		response = Utils.generateErrorResponse(new Error("Application encountered an error. Twenty Two", "500"));
	}

	Utils.Log.response(response, REQ);
	return response;

};


module.exports = {
	process
};