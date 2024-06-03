const Utils = require("../utils");
const Tasks = require("./tasks.js");

const main = async () => {

	const timerMain = new Utils.Timer("Main", true);

	return new Promise(async (resolve, reject) => {

		try {
			

			/* Tasks - We will be calling multiple APIs simultainously. */
			let appTasks = []; // we'll collect the tasks and their promises here

			appTasks.push(Tasks.getGames());
			appTasks.push(Tasks.getPrediction());
			appTasks.push(Tasks.getWeather());

			/* this will return everything promised into an indexed array */
			let appCompletedTasks = await Promise.all(appTasks);

			// Utils.TestResponseDataModel.run(); // demo/test ResponseDataModel

			/**
			 *  Responses from each task are collected into this Response object 
			 */
			const dataResponse = new Utils.Response({game: "", prediction: "", weather: {}});

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

module.exports = {
	main
};