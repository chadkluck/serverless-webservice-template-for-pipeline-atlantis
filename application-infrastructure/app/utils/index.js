/**
 * Classes specific for this application. They contain specific
 * app related functions. Some may extend and customize classes
 * from tools.js
 */

"use strict";

const { tools } = require('@chadkluck/cache-data');

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

// we want to include these in our tools namespace so others can use them
module.exports = Object.assign({}, tools, {
	ApplicationError,
	Request,
	Response,
	Tests,
	Log
});