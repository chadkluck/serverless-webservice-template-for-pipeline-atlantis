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
	const timer = new Utils.tools.Timer("Game Controller Task", true);

	const games = await getGames(REQ).toObject().games;

	// as long as we got what we expected, pick a game based on cosmic chance
	if( games instanceof Object && "gamechoices" in games && Array.isArray(games.gamechoices) ) {
		data = games.gamechoices[Math.floor(Math.random() * games.gamechoices.length)];
	}
	
	timer.stop();

	return new Utils.Response(body, "game");

};

module.exports = {
	getGames,
	getGame
};