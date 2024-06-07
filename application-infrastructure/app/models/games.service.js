const { Config } = require("../config");
const { endpoint, cache } = require("@chadkluck/cache-data");

module.exports = {
	get: async (REQ) => {

		let body = {};

		try {
			// we are going to modify the connection by adding a path
			let connection = Config.getConnection("demo");
			let conn = connection.toObject();
			conn.path = "/games/";
			conn.options = conn.options || {};
			conn.options.timeout = REQ.calcRemainingTimeInMillis(500);

			let cacheCfg = connection.getCacheProfile("games");

			const cacheObj = await cache.CacheableDataAccess.getData(
				cacheCfg, 
				endpoint.getDataDirectFromURI,
				conn, 
				null
			);

			body = cacheObj.getBody(true);

		} catch (error) {
			body = { message: "Error retrieving games" };
			Utils.tools.DebugAndLog.error(`Games Service: ${error.message}`, JSON.stringify(error.stack));
		}

		return body;
	}
};