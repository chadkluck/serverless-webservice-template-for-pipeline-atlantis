// const Utils = require("../utils");
// const {Config} = require("../config");

const template = function (data) {
	
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
	return response;
};

const weather = function (data) {
	return data;
};

const prediction = function (data) {
	return data;
};

const game = function (data) {
	return data;
};

module.exports = {
	template
};