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
	
			// // gather the pieces
			// const games_getGame = GamesTask.getGame(REQ)
			// const games_findGame = GamesTask.findGame(REQ);
			// const games_getGames = GamesTask.getGames(REQ);
	
			// const prediction_getPrediction = PredictionTask.getPrediction(REQ);
			// const weather_getWeather = WeatherTask.getWeather(REQ)
	
			// let appTasks = []; // we'll collect the tasks and their promises here
	
			// appTasks.push(games_getGame);
			// appTasks.push(games_findGame);
			// appTasks.push(games_getGames);
	
			// appTasks.push(prediction_getPrediction);
			// appTasks.push(weather_getWeather);
		
			let appTasks = []; // we'll collect the tasks and their promises here

			appTasks.push(GamesTask.getGame(REQ));
			appTasks.push(GamesTask.findGame(REQ));
			appTasks.push(GamesTask.getGames(REQ));
	
			appTasks.push(PredictionTask.getPrediction(REQ));
			appTasks.push(WeatherTask.getWeather(REQ));

			/* this will return everything promised into an indexed array */
			await Promise.all(appTasks);
	
			// assemble the pieces
			response = GenericJsonResponse.status200;
			response.body = JSON.stringify({
				game: appTasks[0],
				find: appTasks[1],
				games: appTasks[3],
	
				prediction: appTasks[4],
				weather: appTasks[5],
			});
	
		} catch (error) {
			Utils.tools.DebugAndLog.error(`Main Controller error: ${error.message}`, error.stack);
			response = Utils.generateErrorResponse(new Error("Application encountered an error. Main", "500"));
		};
		
		timer.stop();
		resolve(response);

	});

};