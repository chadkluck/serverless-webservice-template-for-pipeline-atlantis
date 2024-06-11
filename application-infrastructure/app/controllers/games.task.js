const Utils = require("../utils");
const GamesSvc = require("../models/games.service");

/* Tasks are async functions that are dispatched by controllers
*/

/**
 * Calls the Games Service for a list of games
 * @param {Utils.Request} REQ Request Object
 * @returns {Promise<{gamechoices: Array<string>, hiddengames: Array<string>}>} A list of games
 */
const getGames = async (REQ) => {
	return new Promise(async (resolve, reject) => {
		const timer = new Utils.tools.Timer("Games Controller Task", true);
		const data = await GamesSvc.get(REQ);
		timer.stop();
		resolve(data);
	});
};

/**
 * 
 * @param {Utils.Request} REQ 
 * @returns {Promise<string>} A random or requested game by number
 */
const getGame = async (REQ) => {
	return new Promise(async (resolve, reject) => {

		let value = "";

		const timer = new Utils.tools.Timer("Game Controller Task", true);

		const data = await getGames(REQ);

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

		resolve(value);
	});

};

/**
 * 
 * @param {Utils.Request} REQ 
 * @returns {Promise<number>} The index of the requested game or null if not found
 */
const findGame = async (REQ) => {
	return new Promise(async (resolve, reject) => {
		let value = null;

		const timer = new Utils.tools.Timer("Find Game Controller Task", true);


		if (REQ.getProperties()?.game) {

			const data = await getGames(REQ);

			// as long as we got what we expected, pick a game based on cosmic chance
			if( data instanceof Object && "gamechoices" in data && Array.isArray(data.gamechoices)) {
				value = data.gamechoices.findIndex(game => game.toUpperCase() === REQ.getProperties().game.toUpperCase());
			}

			// if value is null, search hiddengames
			if (value === null && "hiddengames" in data && Array.isArray(data.hiddengames)) {
				let i = data.hiddengames.findIndex(game => game.toUpperCase() === REQ.getProperties().game.toUpperCase());
				if (i) {
					value = ((i+1)*-1);
				}
			}		
		}

		timer.stop();

		resolve(value);
	});

};

module.exports = {
	getGames,
	getGame,
	findGame
};