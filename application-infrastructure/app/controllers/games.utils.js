
/**
 * Given a number, select the game from the list of games.  If the number is 0, a random game is selected
 * from gamechoices only.
 * Because 0 is reserved for random selection, and the numbered options presented to the user will most
 * likely start at 1, the selection does not account for an index of 0. Therefore, selection = index+1. 
 * If selection is 1, then gamechoices[0] is returned. If selection is -2 then hiddengames[1] is returned.
 * @param {number} selection Number greater than 0 will return a game from gamechoices, 0 will be random from game choices, and a negative number will return selection from hiddengames
 * @param {{gamechoices: Array<string>, hiddengames: Array<string>}} games 
 * @returns {string|null} The selected game. Null is returned for invalid selections.
 */
const selectedGame = (selection, games) => {

	// return value
	let game = null;

	// selection must be a number
	selection = parseInt(selection, 10);

	// validate games
	if( games instanceof Object 
		&& "gamechoices" in games 
		&& Array.isArray(games.gamechoices) 
		&& "hiddengames" in games 
		&& Array.isArray(games.gamechoices)) {

		// set the list we will use
		let list = (selection >= 0) ? games.gamechoices : games.hiddengames;

		// choose a random game if 0
		if (selection === 0) {
			selection = Math.ceil(Math.random() * list.length);
		}

		// Make it positive
		if (selection < 0) {
			selection = ((selection*-1));
		}

		// account for 0 index and pick from list
		game = (selection <= list.length) ? list[selection-1] : null;

	}

	return game;

}

/**
 * 
 * @param {string} name 
 * @param {{gamechoices: Array<string>, hiddengames: Array<string>}} games 
 * @returns {number} A positive or negative value representing place on list (index starting at 1, not 0) A return value of 0 indicates not found
 */
const getIndexOfGame = (name, games) => {

	// return value
	let index = 0;

	// validate name and games
	if( typeof name === "string"
		&& games instanceof Object
		&& "gamechoices" in games
		&& Array.isArray(games.gamechoices)
		&& "hiddengames" in games
		&& Array.isArray(games.gamechoices)) {

		name = name.toUpperCase();

		// in case we need to invert
		let m = 1;

		// search gamechoices for index of name in uppercase
		index = games.gamechoices.findIndex(game => game.toUpperCase() === name);


		// not found in gamechoices so search hiddengames and set inverter
		if (index === -1) {
			index = games.hiddengames.findIndex(game => game.toUpperCase() === name);
			m = -1;
		}

		if (index !== -1) {
			index = (index+1)*m;
		} else {
			index = 0;
		}

	}

	return index;
}

module.exports = {
	selectedGame,
	getIndexOfGame
}