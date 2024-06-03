const Utils = require("../utils");
const {Config} = require("../config");

/* Tasks are async functions that are dispatched by controllers
*/

/**
 * Calls the games external api for a list of games and randomly
 * selects a game.
 * @returns {Response} a randomly selected game
 */
const getGames = async () => {

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
			Utils.DebugAndLog.error("getGames CacheController error", { message: error.message, trace: error.stack });
			timerTaskGetGames.stop();
			reject( new obj.Response({ msg: "error" }, "game") );
		};

	});

};

/**
 * Calls the magic ball api for a prediction
 * @returns {Response} A prediction
 */
const getPrediction = async () => {

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
const getWeather = async () => {

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

module.exports = {
	getGames,
	getPrediction,
	getWeather
};