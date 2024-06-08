const Utils = require("../utils");
const GamesSvc = require("../models/games.service");

/* Tasks are async functions that are dispatched by controllers
*/

/**
 * Calls the Games Service for a list of games
 * @param {Utils.Request} REQ Request Object
 * @returns {Utils.Response} A list of games
 */
const getGames = async (REQ) => {
	const timer = new Utils.tools.Timer("Games Controller Task", true);
	const data = await GamesSvc.get(REQ);
	timer.stop();
	return new Utils.Response(data, "games");
};

const getGame = async (REQ) => {
	let value = "";

	const timer = new Utils.tools.Timer("Game Controller Task", true);

	const data = (await getGames(REQ)).toObject().games;

	if( data instanceof Object && "gamechoices" in data && Array.isArray(data.gamechoices) ) {

		if ("play" in REQ.getProperties()) {
			// user requested a game by number
			let i = parseInt(REQ.getProperties().play, 10);

			if (i >= 0 && i < data.gamechoices.length) {
				// valid selection of gamechoices
				value = data.gamechoices[i];
			} else if (i < 0 && "hiddengames" in data && Array.isArray(data.hiddengames) && ((i*-1)+1) < data.hiddengames.length) {
				// valid selection of hidden games
				i = ((i*-1)+1);
				value = data.hiddengames[i];
			} else {
				value = "Invalid game selection";
			}
		} else {
			// pick a game based on cosmic chance
			value = data.gamechoices[Math.floor(Math.random() * data.gamechoices.length)];
		}
	}
	
	timer.stop();

	return new Utils.Response(value, "game");

};

const findGame = async (REQ) => {
	let value = null;

	const timer = new Utils.tools.Timer("Find Game Controller Task", true);

	const data = await getGames(REQ).toObject().games;

	// as long as we got what we expected, pick a game based on cosmic chance
	if( data instanceof Object && "gamechoices" in data && Array.isArray(data.gamechoices) ) {
		value = data.gamechoices.find(game => game.toUpperCase() === REQ.getProperties().game.toUpperCase());
	}

	// if value is null, search hiddengames
	if (value === null && "hiddengames" in data && Array.isArray(data.hiddengames)) {
		let i = data.hiddengames.find(game => game.toUpperCase() === REQ.getProperties().game.toUpperCase());
		if (i) {
			value = ((i+1)*-1);
		}
	}

	timer.stop();

	return new Utils.Response(value, "gameNumber");

};

module.exports = {
	getGames,
	getGame,
	findGame
};