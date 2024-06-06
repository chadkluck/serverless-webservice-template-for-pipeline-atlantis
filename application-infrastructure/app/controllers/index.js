const Utils = require("../utils");
const Tasks = require("./tasks.js");

/**
 * 
 * @param {Utils.Request} REQ 
 * @returns 
 */
const main = async (REQ) => {

	const timerMain = new Utils.tools.Timer("Main", true);

	return new Promise(async (resolve, reject) => {

		try {
			

			/* Tasks - We will be calling multiple APIs simultainously. */
			let appTasks = []; // we'll collect the tasks and their promises here

			appTasks.push(Tasks.getGames(REQ));
			appTasks.push(Tasks.getPrediction(REQ));
			appTasks.push(Tasks.getWeather(REQ));

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
				Utils.tools.DebugAndLog.debug("Response Item",item);
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
			Utils.tools.DebugAndLog.error(`Main error: ${error.message}`, error.stack);
			response = Utils.generateErrorResponse(new Error("Application encountered an error. Main", "500"));
			timerMain.stop();
			reject( response );
		};
	});
};

module.exports = {
	main
};