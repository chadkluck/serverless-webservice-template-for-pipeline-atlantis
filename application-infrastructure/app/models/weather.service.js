const { Config } = require("../config");
const Utils = require("../utils");
const { endpoint, cache } = require("@chadkluck/cache-data");

module.exports = {
	get: async (REQ) => {

		let body = {};

		try {
			let connection = Config.getConnection("weather");
			let conn = connection.toObject();
			// conn.path = ""; // we will just use the path set in the connection details
			conn.options = conn.options || {};
			conn.options.timeout = REQ.calcRemainingTimeInMillis(500);
						
			if (conn.parameters.appid !== "BLANK") {
			
				let cacheCfg = connection.getCacheProfile("default");
			
				const cacheObj = await cache.CacheableDataAccess.getData(
					cacheCfg, 
					endpoint.getDataDirectFromURI,
					conn, 
					null
				);
			
				body = cacheObj.getBody(true);

			} else {
				body = { message: "Weather API key not set" };
				Utils.tools.DebugAndLog.warn("weather api key not set - please update in SSM Parameter Store");
			}

		} catch (error) {
			body = { message: "Error retrieving weather" };
			Utils.tools.DebugAndLog.error(`Weather Service: ${error.message}`, JSON.stringify(error.stack));
		}

		return body;

	}
};