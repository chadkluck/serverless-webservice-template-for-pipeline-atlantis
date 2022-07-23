/**
 * Classes specific for this application. They contain specific
 * app related functions. Some may extend and customize classes
 * from tools.js
 */

"use strict";

const { tools, cache } = require('@chadkluck/cache-data');

class ApplicationError extends Error {  
	constructor (message) {
	  super(message)
  
	  // assign the error class name in your custom error (as a shortcut)
	  this.name = this.constructor.name
  
	  // capturing the stack trace keeps the reference to your error class
	  Error.captureStackTrace(this, this.constructor);
  
	}
};

/**
 * Extends tools.RequestInfo
 * Can be used to create a custom Request object
 */
class Request extends tools.RequestInfo {

	/**
	 * Initializes the request data based on the event. Also sets the 
	 * validity of the request so it may be checked by .isValid()
	 * @param {object} event object from Lambda
	 */
	constructor(event) {
		super(event);
		this.#setIsValid();
	};

	/**
	 * Used in the constructor to set validity of the request
	 * This method may be customized to meet your validation needs
	 */
	#setIsValid() {
	
		let valid = false;

		// add your additional validations here
		valid = this.isValidReferer();

		// set the variable
		super._isValid = valid;

	};

	/**
	 * Is the request from a valid referer?
	 * Referrers are set in custom/settings.json
	 * @returns {boolean}
	 */
	isValidReferer() {
		//return  Config.isValidReferer(super.getClientReferer()); // uncomment this one if you want to check referers
		return true;
	};

};

/**
 * Extends tools.ResponseDataModel
 * Can be used to create a custom Response interface
 */
class Response extends tools.ResponseDataModel {

	/**
	 * 
	 * @param {Response|*} data Default structure along with any declarations of arrays or objects and default values.
	 * @param {string} label A label or key to use when added to another Response object or sent as a response
	 */
	constructor(data = null, label = "") {
		super(data, label);
	};

};

/**
 * Extends tools.ResponseDataModel
 * A small example of how to create a custom model
 */
class Tests extends tools.ResponseDataModel {

	/**
	 * 
	 * @param {array} testObject 
	 */
	constructor(testObject) {
		super(null, "tests");
		super.addTests(testObject);
	};

	/**
	 * Add a series of tests to the response model
	 * @param {array} objArray 
	 */
	addTests(objArray) {

		for (const test of objArray) {
			let keys = Object.keys(test);

			for (const key of keys) {
				super.addItemByKey(key, test[key]);
			}
			
		};
	};
};



/**
 * Extends tools._ConfigSuperClass
 * Used to create a custom Config interface
 * Usage: should be placed near the top of the script file outside 
 * of the event handler. It should be global and must be initialized.
 * @example
 * const obj = require("./classes.js");
 * obj.Config.init();
 */
class Config extends tools._ConfigSuperClass {
	
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
		tools.DebugAndLog.debug("Settings for key: "+key, obj);
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
	 * This is custom inititialization code for the application. Depending 
	 * upon needs, the _init functions from the super class may be used
	 * as needed. Init is async, and a promise is stored, allowing the 
	 * lambda function to wait until the promise is finished.
	 */
	static async init() {
		
		tools._ConfigSuperClass._promise = new Promise(async (resolve, reject) => {

			const timerConfigInit = new tools.Timer("timerConfigInit", true);
				
			try {

				let params = await this._initParameters(
					[
						{
							"group": "app", // so we can do params.app.weatherapikey later
							"path": process.env.paramStorePath // Lambda environment variable
						}
					]
				);

				let customSettings = require("./custom/settings.json");

				/* You can divide up your custom settings file into sections and separate them out.
				Use of policies, settings, and referers are already provided for you.
				To create additional sections, add them to settings.json and add them here.
				Be sure to create appropriate getters. Use getPolicies() or getSettings() as a template
				*/
				if ( "policies" in customSettings ) { this.#policies = customSettings.policies; }
				if ( "settings" in customSettings ) { this.#settings = customSettings.settings; }
				if ( "referers" in customSettings ) { this.#referers = customSettings.referers; }

				// after we have the params, we can set the connections
				let connections = new tools.Connections();

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
						appid: ("apikey_weather" in params.app ? params.app.apikey_weather : "") // this is set from the SSM Parameters brought in
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

				tools._ConfigSuperClass._connections = connections;

				tools.DebugAndLog.debug("Config Connections: ", this.connections());

				// Cache settings
				cache.Cache.init({
					dynamoDbTable: process.env.DynamoDb_table_cache,
					s3Bucket: process.env.S3_bucket_cache,
					secureDataAlgorithm: process.env.crypt_secureDataAlgorithm,
					secureDataKey: Buffer.from(params.app.crypt_secureDataKey, cache.Cache.CRYPT_ENCODING),
					idHashAlgorithm: process.env.crypt_idHashAlgorithm,
					DynamoDbMaxCacheSize_kb: parseInt(process.env.DynamoDb_maxCacheSize_kb, 10),
					purgeExpiredCacheEntriesAfterXHours: parseInt(process.env.purgeExpiredCacheEntriesAfterXHours, 10),
					defaultExpirationExtensionOnErrorInSeconds: parseInt(process.env.errorExpirationInSeconds, 10),
					timeZoneForInterval: Config.getSettings("timeZoneForCacheInterval") // if caching on interval, we need a timezone to account for calculating hours, days, and weeks. List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
				});

				tools.DebugAndLog.debug("Cache: ", cache.Cache.info());

				// We're done
				timerConfigInit.stop();
				
				resolve(true);
			} catch (error) {
				tools.DebugAndLog.error("Could not initialize Config", error);
				reject(false);
			};
			
		});

	};
};

class Log {
	/**
	 * Same as debug() but ignores the silent switch, making it useful for 
	 * Critical Errors that admins should be aware of in a production
	 * environment.
	 *  
	 * @param {string} text 
	 * @param {object} obj
	 * @param {tools.RequestInfo|Request} request
	 */
	static async critical ( text, obj, request) {
		
	   /* These are pushed onto the array in the same order that the CloudWatch
		query is expecting to parse out. 
		-- NOTE: If you add any here, be sure to update the Dashboard template --
		-- that parses response logs in template.yml !!                        --
		*/			
		let logFields = [];
		logFields.push(request.getClientIP());
		logFields.push( (( request.getClientUserAgent() !== "" ) ? request.getClientUserAgent() : "-").replace("|", "") ); // doubtful, but userAgent could have | which will mess with log fields
		logFields.push( (( request.getClientOrigin() !== "" ) ? request.getClientOrigin() : "-") );
		logFields.push( (( request.getClientReferer() !== "" ) ? request.getClientReferer() : "-") );

		/* Join array together into single text string delimited by ' | ' */
		let msg = logFields.join(" | ")+" | "+text;

		/* If we have an object to log we want to save it */
		let logObject = {};
		if (obj !== null) {
			logObject = obj;
		}

		tools.DebugAndLog.error(msg, logObject);

	};

	/** 
	 * Formats a log entry for later parsing in CloudWatch. 
	 * Log the request to CloudWatch
	 * 
	 * @param {object} response 
	 * @param {number} elapsed
	 * @param {tools.RequestInfo|Request} request
	 */
	static async response(response, elapsed, request) {

		/* These are pushed onto the array in the same order that the CloudWatch
		query is expecting to parse out. 
		-- NOTE: If you add any here, be sure to update the Dashboard template --
		-- that parses response logs in template.yml !!                        --
		*/
		let logFields = [];
		logFields.push(response.statusCode);
		logFields.push(elapsed);
		logFields.push(request.getClientIP());
		logFields.push( (( request.getClientUserAgent() !== "" ) ? request.getClientUserAgent() : "-").replace("|", "") ); // doubtful, but userAgent could have | which will mess with log fields
		logFields.push( (( request.getClientOrigin() !== "" ) ? request.getClientOrigin() : "-") );
		logFields.push( (( request.getClientReferer() !== "" ) ? request.getClientReferer() : "-") );

		/* Join array together into single text string delimited by ' | ' */
		let msg = logFields.join(" | ");

		/* send it to CloudWatch via DebugAndLog.log() */
		tools.DebugAndLog.log(msg, "RESPONSE");

	};
}

module.exports = {
	ApplicationError,
	Config,
	Request,
	Response,
	Tests,
	Log
};