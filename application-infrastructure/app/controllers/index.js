const Utils = require("../utils");
const GamesTask = require("./games.task");
const PredictionTask = require("./prediction.task");
const WeatherTask = require("./weather.task");

/**
 * 
 * @param {Utils.Request} REQ 
 * @returns 
 */
const main = async (REQ) => {

	const timer = new Utils.tools.Timer("Main.controller", true);

	let response = new Utils.Response();

	/* Tasks - We will be calling multiple remote APIs simultaneously. */

	try {
		let appTasks = []; // we'll collect the tasks and their promises here

		appTasks.push(GamesTask.getGame(REQ));
		appTasks.push(PredictionTask.getPrediction(REQ));
		appTasks.push(WeatherTask.getWeather(REQ));

		appTasks.push(GamesTask.findGame(REQ));
		appTasks.push(GamesTask.getGames(REQ));

		/* this will return everything promised into an indexed array */
		const appCompletedTasks = await Promise.all(appTasks);

		// loop through appComplatedTasks and add to reponse
		appCompletedTasks.forEach(task => {
			response.addItem(task);
		});

	} catch (error) {
		Utils.tools.DebugAndLog.error(`Main Controller error: ${error.message}`, error.stack);
		response = Utils.generateErrorResponse(new Error("Application encountered an error. Main", "500"));
	};
	
	timer.stop();
	return response;

};

module.exports = {
	main
};