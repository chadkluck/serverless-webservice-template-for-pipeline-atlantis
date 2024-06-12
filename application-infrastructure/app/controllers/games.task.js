const Utils = require("../utils");
const GamesSvc = require("../models/games.service");
const GamesUtils = require("./games.utils");

/* Tasks are async functions that are dispatched by controllers
*/

/**
 * Calls the Games Service for a list of games
 * @param {Utils.Request} REQ Request Object
 * @returns {Promise<{gamechoices: Array<string>, hiddengames: Array<string>}>} A list of games
 */
const getGames = async (REQ) => {
	return new Promise(async (resolve, reject) => {
		const timer = new Utils.tools.Timer("Games Controller Task: Get Games", true);
		const data = await GamesSvc.get(REQ);
		Utils.tools.DebugAndLog.debug("Games Controller Task: Get Games: Retrieved games", data);
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

		let game = "";

		const timer = new Utils.tools.Timer("Game Controller Task: Choose Game", true);

		const data = await getGames(REQ);

		game = GamesUtils.selectedGame((REQ.getProperties()?.selection || 0), data);
		
		if (game === null) {
			game = "Invalid game selection";
		}

		Utils.tools.DebugAndLog.debug("Game Controller Task: Choose Game: Chosen game", game);
		
		timer.stop();

		resolve(game);
	});

};


/**
 * 
 * @param {Utils.Request} REQ 
 * @returns {Promise<number|null>} The index of the requested game, 0 if not found, null if invalid name
 */
const findGame = async (REQ) => {
	return new Promise(async (resolve, reject) => {
		let value = null;

		const timer = new Utils.tools.Timer("Game Controller Task: Find", true);

		if (REQ.getProperties()?.name) {

			const data = await getGames(REQ);

			value = GamesUtils.getIndexOfGame(REQ.getProperties().name, data);
		}

		Utils.tools.DebugAndLog.debug("Game Controller Task: Find: Found game", value);

		timer.stop();

		resolve(value);
	});

};

module.exports = {
	getGames,
	getGame,
	findGame
};