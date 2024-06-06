const Utils = require("../utils");
const {Config} = require("../config");

/* Tasks are async functions that are dispatched by controllers
*/

/**
 * Calls the games external api for a list of games and randomly
 * selects a game.
 * @param {Utils.Request} REQ Request Object
 * @returns {Utils.Response} a randomly selected game
 */
const getGames = async (REQ) => {

	return new Promise(async (resolve, reject) => {

		const timerTaskGetGames = new Utils.tools.Timer("timerTaskGetGames", true);

		try {

			// we are going to modify the connection by adding a path
			let connection = Config.getConnection("demo");
			let conn = connection.toObject();
			conn.path = "/games/";
			conn.options = conn.options || {};
			conn.options.timeout = REQ.calcRemainingTimeInMillis(500);

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
			resolve( new Utils.Response(body, "game") );
			
		} catch (error) {
			Utils.tools.DebugAndLog.error(`getGames CacheController error: ${error.message}`, error.stack);
			timerTaskGetGames.stop();
			reject( new Utils.Response({ msg: "error" }, "game") );
		};

	});

};

/**
 * Calls the magic ball api for a prediction
 * @param {Utils.Request} REQ Request Object
 * @returns {Utils.Response} A prediction
 */
const getPrediction = async (REQ) => {

	return new Promise(async (resolve, reject) => {

		const timerTaskGetPrediction = new Utils.tools.Timer("timerTaskGetPrediction", true);

		try {

			// we are going to modify the connection by adding a path
			let connection = Config.getConnection("demo");
			let conn = connection.toObject();
			conn.path = "/8ball/";
			conn.options = conn.options || {};
			conn.options.timeout = REQ.calcRemainingTimeInMillis(500);

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
			resolve( new Utils.Response(body, "prediction") );
			
		} catch (error) {
			Utils.tools.DebugAndLog.error(`taskGetPrediction CacheController error: ${error.message}`, error.stack);
			timerTaskGetPrediction.stop();
			reject( new Utils.Response({ msg: "error" }, "prediction") );
		};

	});

};

/**
 * Connects to an external weather api and retrieves weather information
 * @param {Utils.Request} REQ Request Object
 * @returns {Utils.Response} weather information
 */
const getWeather = async (REQ) => {

	return new Promise(async (resolve, reject) => {

		const timerTaskGetWeather = new Utils.tools.Timer("timerTaskGetWeather", true);

		try {

			let connection = Config.getConnection("weather");
			let conn = connection.toObject();
			// conn.path = ""; // we will just use the path set in the connection details
			conn.options = conn.options || {};
			conn.options.timeout = REQ.calcRemainingTimeInMillis(500);
			
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
				Utils.tools.DebugAndLog.warn("weather api key not set - please update in SSM Parameter Store");
			}

			timerTaskGetWeather.stop();
			resolve( new Utils.Response(body, "weather") );
			
		} catch (error) {
			Utils.tools.DebugAndLog.error(`taskGetWeather CacheController error: ${error.message}`, error.stack);
			timerTaskGetWeather.stop();
			reject( new Utils.Response({ msg: "error" }, "weather") );
		};

	});

};

module.exports = {
	getGames,
	getPrediction,
	getWeather
};