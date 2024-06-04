
const { cache } = require('@chadkluck/cache-data');
const Utils = require('../utils');
const customSettings = require("./settings.json");

/* increase the log level - comment out when not needed  */
Utils.tools.DebugAndLog.setLogLevel(5, "2025-10-30T04:59:59Z"); // we can increase the debug level with an expiration

/**
 * Extends Utils.tools._ConfigSuperClass
 * Used to create a custom Config interface
 * Usage: should be placed near the top of the script file outside 
 * of the event handler. It should be global and must be initialized.
 * @example
 * const obj = require("./classes.js");
 * obj.Config.init();
 */
class Config extends Utils.tools._ConfigSuperClass {
	
	/**
	 * 
	 */
	// constructor() { super(); };

	static #policies = {};
	static #settings = {};
	static #referers = [];

	/**
	 * Get settings, or a named portion of settings from the custom/settings.json file.
	 * @param {string} key If null, it will return the entire settings object. If provided it will return the value of the key
	 * @returns {object|string|number|array|Boolean} Null if no key or setting was found.
	 */
	static getSettings(key = null) {
		let obj = null;
		if ( key === null ) {
			obj = this.#settings;
		} else if ( key in this.#settings ) {
			obj = this.#settings[key];
		}
		Utils.tools.DebugAndLog.debug("Settings for key: "+key, obj);
		return (obj !== null) ? JSON.parse(JSON.stringify(obj)) : null;
	};

	/**
	 * Get policies, or a named portion of policies from the custom/settings.json file.
	 * @param {string} key If null, it will return the entire policies object. If provided it will return the value of the key
	 * @returns {object|string|number|array|Boolean} Null if no key or policy was found.
	 */
	static getPolicies(key = null) {
		let obj = null;
		if ( key === null ) {
			obj = this.#policies;
		} else if ( key in this.#policies ) {
			obj = this.#policies[key];
		}
		return (obj !== null) ? JSON.parse(JSON.stringify(obj)) : null;
	};

	/**
	 * 
	 * @returns {array} Referers provided by the custom/settings.json file. Empty if none
	 */
	static getReferers() {
		return (this.#referers.length > 0) ? JSON.parse(JSON.stringify(this.#referers)) : [];
	};

	/**
	 * Check the referer against accepted referers listed in the custom/settings.json file
	 * @param {string} referer The referer
	 * @returns {Boolean} true if there is a match or if no referers in custom/settings.json. False if no match.
	 */
	static isValidReferer(referer) {
		let referers = this.#referers; // shouldn't be in danger of modifying so we will access directly
		/* If we do not have any referers, then return true. Otherwise, check to see if the provided
		referer is present.
		*/
		return ( 
			(referers.length === 0) 
			|| ( referer !== "" && referer !== null && referers.some( function(item) { return referer.split('/')[2].endsWith(item); } )) 
		);
	};

	/**
	 * This is custom initialization code for the application. Depending 
	 * upon needs, the _init functions from the super class may be used
	 * as needed. Init is async, and a promise is stored, allowing the 
	 * lambda function to wait until the promise is finished.
	 */
	static async init() {
		
		Utils.tools._ConfigSuperClass._promise = new Promise(async (resolve, reject) => {

			const timerConfigInit = new Utils.tools.Timer("timerConfigInit", true);
				
			try {

				// let params = await this._initParameters(
				// 	[
				// 		{
				// 			"group": "app", // so we can do params.app.weatherapikey later
				// 			"path": process.env.paramStore // Lambda environment variable
				// 		}
				// 	]
				// );


				/* You can divide up your custom settings file into sections and separate them out.
				Use of policies, settings, and referers are already provided for you.
				To create additional sections, add them to settings.json and add them here.
				Be sure to create appropriate getters. Use getPolicies() or getSettings() as a template
				*/
				if ( "policies" in customSettings ) { this.#policies = customSettings.policies; }
				if ( "settings" in customSettings ) { this.#settings = customSettings.settings; }
				if ( "referers" in customSettings ) { this.#referers = customSettings.referers; }

				// after we have the params, we can set the connections
				let connections = new Utils.tools.Connections();

				/* NOTE: instead of hard coding connections, you could import 
				from a connections file (or include in the settings.json file)
				in custom and then add in any additional values such as keys 
				from the Param store
				*/

				// for both magic ball and games demo from api.chadkluck.net
				connections.add( {
					name: "demo",
					host: "api.chadkluck.net",
					parameters: {},
					headers: {
						referer: "https://chadkluck.net"
					},
					cache: [
						{
							profile: "games",
							overrideOriginHeaderExpiration: true, 
							defaultExpirationInSeconds: (10 * 60),// , // 10 minutes
							expirationIsOnInterval: true,
							headersToRetain: "",
							host: "demo", // log entry friendly (or not)
							path: "games",  // log entry friendly (or not)
							encrypt: false
						},
						{
							profile: "prediction",
							overrideOriginHeaderExpiration: true, 
							defaultExpirationInSeconds: (1),// , // 1 second
							expirationIsOnInterval: true,
							headersToRetain: "",
							host: "demo", // log entry friendly (or not)
							path: "prediction", // log entry friendly (or not)
							encrypt: true
						}
					]
				} );

				// https://openweathermap.org/current
				// go to openweathermap.org and create an appid api key and save it in parameter store
				connections.add( {
					name: "weather",
					host: "api.openweathermap.org",
					path: "/data/2.5/weather",
					parameters: {
						q: this.#settings.weather.q, // note how we are bringing this in from settings.json
						units: this.#settings.weather.units, // note how we are bringing this in from settings.json
						appid: new Utils.tools.CachedSSMParameter(process.env.paramStore+'Weather_APIKey', {refreshAfter: 300}),
					},
					cache: [
						{
							profile: "default",
							overrideOriginHeaderExpiration: true, 
							defaultExpirationInSeconds: (5 * 60),// , // 5 minutes
							expirationIsOnInterval: true,
							headersToRetain: "",
							host: "weather", // log entry friendly (or not)
							path: "default", // log entry friendly (or not)
							encrypt: false
						}
					]        
				} );

				Utils.tools._ConfigSuperClass._connections = connections;

				// Cache settings
				cache.Cache.init({
					dynamoDbTable: process.env.CacheData_DynamoDbTable,
					s3Bucket: process.env.CacheData_S3Bucket,
					secureDataAlgorithm: process.env.CacheData_CryptSecureDataAlgorithm,
					// secureDataKey: Buffer.from(params.app.CacheData_SecureDataKey, cache.Cache.CRYPT_ENCODING),
					secureDataKey: new Utils.tools.CachedSSMParameter(process.env.paramStore+'CacheData_SecureDataKey', {refreshAfter: 300}),
					idHashAlgorithm: process.env.CacheData_CryptIdHashAlgorithm,
					DynamoDbMaxCacheSize_kb: parseInt(process.env.CacheData_DynamoDb_maxCacheSize_kb, 10),
					purgeExpiredCacheEntriesAfterXHours: parseInt(process.env.CacheData_PurgeExpiredCacheEntriesAfterXHours, 10),
					defaultExpirationExtensionOnErrorInSeconds: parseInt(process.env.CacheData_ErrorExpiresInSeconds, 10),
					timeZoneForInterval: process.env.CacheData_TimeZoneForInterval, // if caching on interval, we need a timezone to account for calculating hours, days, and weeks. List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
				});

				Utils.tools.DebugAndLog.debug("Cache: ", cache.Cache.info());

				// We're done
				timerConfigInit.stop();
				
				resolve(true);
			} catch (error) {
				Utils.tools.DebugAndLog.error(`Could not initialize Config ${error.message}`, JSON.stringify(error.stack));
				reject(false);
			};
			
		});


	};

	static async prime() {
		return Promise.all([
			cache.CacheableDataAccess.prime(),
			Utils.tools.CachedParameterSecrets.prime()
		]);
	};
};

module.exports = {
	Config
};