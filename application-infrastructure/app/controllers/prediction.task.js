const Utils = require("../utils");
const PredictionSvc = require("../models/prediction.service");

/* Tasks are async functions that are dispatched by controllers
*/

/**
 * Calls the games external api for a list of games and randomly
 * selects a game.
 * @param {Utils.Request} REQ Request Object
 * @returns {Utils.Response} a randomly selected game
 */
const getPrediction = async (REQ) => {
	let value = "";
	const timer = new Utils.tools.Timer("Prediction Controller Task", true);
	const data = await PredictionSvc.get(REQ);
	if( data instanceof Object && "prediction" in data && typeof data.prediction === "string" ) {
		value = data.prediction;
	}
	timer.stop();
	return new Utils.Response(value, "prediction");
};

module.exports = {
	getPrediction
};