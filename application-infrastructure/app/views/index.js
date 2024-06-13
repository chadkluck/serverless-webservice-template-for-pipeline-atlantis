const Utils = require("../utils");
const GamesTask = require("../controllers/games.task");
const PredictionTask = require("../controllers/prediction.task");
const WeatherTask = require("../controllers/weather.task");

const GenericJsonResponse = require("./json.status.generic");

/**
 * 
 * @param {Utils.Request} REQ 
 * @returns 
 */
exports.root = async (REQ) => {


	return new Promise(async (resolve, reject) => {


		const timer = new Utils.tools.Timer("Main View", true);

		let response = GenericJsonResponse.status500;
	
		/* Controller Tasks - We will be calling multiple remote APIs simultaneously. */
	
		try {
	
			// gather the pieces
			let appTasks = []; // we'll collect the tasks and their promises here

			appTasks.push(GamesTask.getGame(REQ));
			appTasks.push(PredictionTask.getPrediction(REQ));
			appTasks.push(WeatherTask.getWeather(REQ));

			/* this will return everything promised into an indexed array */
			const taskResults = await Promise.all(appTasks);
	
			// assemble the pieces
			response = GenericJsonResponse.status200;
			response.body = JSON.stringify({
				game: taskResults[0],
				prediction: taskResults[1],
				weather: taskResults[2]
			});
	
		} catch (error) {
			Utils.tools.DebugAndLog.error(`Main Controller error: ${error.message}`, error.stack);
			response = Utils.generateErrorResponse(new Error("Application encountered an error. Main", "500"));
		};
		
		timer.stop();
		resolve(response);

	});

};