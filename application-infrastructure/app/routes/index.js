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
	Log Methods
	*******************************************************************************
	*/

	/**
	 * Log the response. Sends to obj.Log.response()
	 * @param {object} response
	 */
	const logResponse = async function(response) {
		obj.Log.response(response, timer.elapsed(), REQ);
	};

	/**
	 * Log an error. Sends to obj.Log.critical()
	 * @param {string} text 
	 * @param {object} obj 
	 */
	const logCritical = async function( text, obj = null) {
		obj.Log.critical( text, obj, REQ );
	};

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

		// send the error message to the console as obj.Log.critical bypasses any debug silencer
		logCritical(statusCode + " " + e.message);

		var response = {statusCode: statusCode, headers: headers, body: body };

		return response;
	};

	/* 
	*******************************************************************************
	Request Execution Container
	*******************************************************************************
	*/

	/**
	 * Execution container for all main logic
	 * @returns {object} response for API Gateway
	 */
	const execute = async function () {

		/*
		=======================================================================
		Main
		*/

		/**
		 * Main function for the app that controls tasks and assembles the 
		 * api response
		 * @returns {object} response for API Gateway
		 */
		const main = async () => {

			const timerMain = new Utils.Timer("Main", true);

			return new Promise(async (resolve, reject) => {

				try {
					

					/* Tasks - We will be calling multiple APIs simultainously. */
					let appTasks = []; // we'll collect the tasks and their promises here

					appTasks.push(taskGetGames());
					appTasks.push(taskGetPrediction());
					appTasks.push(taskGetWeather());

					/* this will return everything promised into an indexed array */
					let appCompletedTasks = await Promise.all(appTasks);

					// Utils.TestResponseDataModel.run(); // demo/test ResponseDataModel

					/**
					 *  Responses from each task are collected into this Response object 
					 */
					const dataResponse = new obj.Response({game: "", prediction: "", weather: {}});

					/* Go through the indexed array of task responses and insert
					them by key into the final response object. */
					for (const item of appCompletedTasks) {
						Utils.DebugAndLog.debug("Response Item",item);
						dataResponse.addItemByKey(item);
					};

					/**
					 * A response object formatted for API Gateway
					 */
					let response = {
						statusCode: 200,
						body: dataResponse.toString(),
						headers: {'content-type': 'application/json'}
					};

					timerMain.stop();

					resolve(response);

				} catch (error) {
					Utils.DebugAndLog.error("Main error", { message: error.message, trace: error.stack });
					response = generateErrorResponse(new Error("Application encountered an error. Main", "500"));
					timerMain.stop();
					reject( response );
				};
			});
		};

		/*
		=======================================================================
		Tasks
		*/

		/**
		 * Calls the games external api for a list of games and randomly
		 * selects a game.
		 * @returns {Response} a randomly selected game
		 */
		const taskGetGames = async () => {

			return new Promise(async (resolve, reject) => {

				const timerTaskGetGames = new Utils.Timer("timerTaskGetGames", true);

				try {

					// we are going to modify the connection by adding a path
					let connection = Config.getConnection("demo");
					let conn = connection.toObject();
					conn.path = "/games/";

					let cacheCfg = connection.getCacheProfile("games");

					const cacheObj = await cache.CacheableDataAccess.getData(
						cacheCfg, 
						endpoint.getDataDirectFromURI,
						conn, 
						null
					);

					let games = cacheObj.getBody(true);
					let body = "";

					// as long as we got what we expected, pick a game based on cosmic chance
					if( games instanceof Object && "gamechoices" in games && Array.isArray(games.gamechoices) ) {
						body = games.gamechoices[Math.floor(Math.random() * games.gamechoices.length)];
					}

					timerTaskGetGames.stop();
					resolve( new obj.Response(body, "game") );
					
				} catch (error) {
					Utils.DebugAndLog.error("taskGetGames CacheController error", { message: error.message, trace: error.stack });
					timerTaskGetGames.stop();
					reject( new obj.Response({ msg: "error" }, "game") );
				};

			});

		};

		/**
		 * Calls the magic ball api for a prediction
		 * @returns {Response} A prediction
		 */
		const taskGetPrediction = async () => {

			return new Promise(async (resolve, reject) => {

				const timerTaskGetPrediction = new Utils.Timer("timerTaskGetPrediction", true);

				try {

					// we are going to modify the connection by adding a path
					let connection = Config.getConnection("demo");
					let conn = connection.toObject();
					conn.path = "/8ball/";

					let cacheCfg = connection.getCacheProfile("prediction");

					const cacheObj = await cache.CacheableDataAccess.getData(
						cacheCfg, 
						endpoint.getDataDirectFromURI,
						conn, 
						null
					);

					let resp = cacheObj.getBody(true);
					let body = "";

					// only return the string
					if( resp instanceof Object && "prediction" in resp && typeof resp.prediction === "string" ) {
						body = resp.prediction;
					}

					timerTaskGetPrediction.stop();
					resolve( new obj.Response(body, "prediction") );
					
				} catch (error) {
					Utils.DebugAndLog.error("taskGetPrediction CacheController error", { message: error.message, trace: error.stack });
					timerTaskGetPrediction.stop();
					reject( new obj.Response({ msg: "error" }, "prediction") );
				};

			});

		};

		/**
		 * Connects to an external weather api and retrieves weather information
		 * @returns {Response} weather information
		 */
		const taskGetWeather = async () => {

			return new Promise(async (resolve, reject) => {

				const timerTaskGetWeather = new Utils.Timer("timerTaskGetWeather", true);

				try {

					let connection = Config.getConnection("weather");
					let conn = connection.toObject();
					// conn.path = ""; // we will just use the path set in the connection details

					let body = {};

					if (conn.parameters.appid !== "BLANK") {

						let cacheCfg = connection.getCacheProfile("default");

						const cacheObj = await cache.CacheableDataAccess.getData(
							cacheCfg, 
							endpoint.getDataDirectFromURI,
							conn, 
							null
						);

						body = cacheObj.getBody(true);
					} else {
						body = { message: "weather api key not set" };
						Utils.DebugAndLog.warn("weather api key not set - please update in SSM Parameter Store");
					}

					timerTaskGetWeather.stop();
					resolve( new obj.Response(body, "weather") );
					
				} catch (error) {
					Utils.DebugAndLog.error("taskGetWeather CacheController error", { message: error.message, trace: error.stack });
					timerTaskGetWeather.stop();
					reject( new obj.Response({ msg: "error" }, "weather") );
				};

			});

		};

		/*
		=======================================================================
		execute() code
		*/

		return await main();

	};

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

	logResponse(functionResponse);
	return functionResponse;

};


module.exports = {
	process
};