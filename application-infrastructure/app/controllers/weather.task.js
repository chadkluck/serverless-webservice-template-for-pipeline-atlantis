const Utils = require("../utils");
const WeatherSvc = require("../models/weather.service");

/* Tasks are async functions that are dispatched by controllers
*/

/**
 * Calls the games external api for a list of games and randomly
 * selects a game.
 * @param {Utils.Request} REQ Request Object
 * @returns {Utils.Response} a randomly selected game
 */
const getWeather = async (REQ) => {
	const timer = new Utils.tools.Timer("Weather Controller Task", true);
	const data = await WeatherSvc.get(REQ);
	timer.stop();
	return data;
};

module.exports = {
	getWeather
};