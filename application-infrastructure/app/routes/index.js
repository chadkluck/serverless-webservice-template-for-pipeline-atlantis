const Utils = require("../utils");
const Ctrl = require("../controllers");

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
	let functionResponse = null;

	try {

		if (REQ.isValid()) {
			// logic for routing goes here, and pass to appropriate controller
			// use if statements or switch statements.
			REQ.addRoute("main");
			functionResponse = await Ctrl.main(REQ); // default is main
		} else {
			functionResponse = Utils.generateErrorResponse(new Error("Invalid request", "403"));
		}
		
	} catch (error) {
		Utils.tools.DebugAndLog.error(`Fatal error: ${error.message}`, JSON.stringify(error.stack ));
		functionResponse = Utils.generateErrorResponse(new Error("Application encountered an error. Twenty Two", "500"));
	}

	Utils.Log.response(functionResponse, REQ);
	return functionResponse;

};


module.exports = {
	process
};