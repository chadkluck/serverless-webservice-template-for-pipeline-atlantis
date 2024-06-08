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

	/* Tasks - We will be calling multiple remote APIs simultaneously. */
	let appTasks = []; // we'll collect the tasks and their promises here
	let appCompletedTasks = [];

	try {
		

		appTasks.push(GamesTask.getGame(REQ));
		appTasks.push(PredictionTask.getPrediction(REQ));
		appTasks.push(WeatherTask.getWeather(REQ));

		appTasks.push(GamesTask.findGame(REQ));
		appTasks.push(GamesTask.getGames(REQ));

		/* this will return everything promised into an indexed array */
		appCompletedTasks = await Promise.all(appTasks);

		resolve(appCompletedTasks);

	} catch (error) {
		Utils.tools.DebugAndLog.error(`Main Controller error: ${error.message}`, error.stack);
		response = Utils.generateErrorResponse(new Error("Application encountered an error. Main", "500"));
	};
	
	timer.stop();
	return appCompletedTasks;

};

module.exports = {
	main
};