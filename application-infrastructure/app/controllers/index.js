const Utils = require("../utils");
const Tasks = require("./tasks.js");

/**
 * 
 * @param {Utils.Request} REQ 
 * @returns 
 */
const main = async (REQ) => {

	const timerMain = new Utils.tools.Timer("Main.controller", true);

	return new Promise(async (resolve, reject) => {

		try {
			
			/* Tasks - We will be calling multiple remote APIs simultaneously. */
			let appTasks = []; // we'll collect the tasks and their promises here

			appTasks.push(Tasks.getGames(REQ));
			appTasks.push(Tasks.getPrediction(REQ));
			appTasks.push(Tasks.getWeather(REQ));

			/* this will return everything promised into an indexed array */
			const appCompletedTasks = await Promise.all(appTasks);

			timerMain.stop();

			resolve(appCompletedTasks);

		} catch (error) {
			Utils.tools.DebugAndLog.error(`Main Controller error: ${error.message}`, error.stack);
			response = Utils.generateErrorResponse(new Error("Application encountered an error. Main", "500"));
			timerMain.stop();
			reject( response );
		};
	});
};

module.exports = {
	main
};