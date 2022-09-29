# Serverless Webservice Template for Pipeline Atlantis

A Web Service template for a serverless Node.js application using AWS Lambda and API Gateway that provides access to external remote api endpoints, caching using AWS DynamoDb, and S3, and stored secrets utilizing SSM Parameter Store.

Using this as a template for your API Gateway/Lambda applications will start you off with a secure way to manage secret keys needed by your application, an internal, secure and self-managed caching system, asynchronous task management for accessing several datasources simultaneously for faster processing.

Developed using the Serverless Application Model (SAM) for packaging infrastructure and code. It is deployed using the Atlantis Project Stack template for a Continuous Integration and Continuous Delivery (CI/CD) pipeline. The nessary parameters for this application's CloudFormation template are passed from the pipeline with additional parameters set in the `template-configuration.json` file.

Note: This is not a stand-alone application. It was developed to be deployed using 'Atlantis CI/CD Pipeline with CloudFormation' which must be deployed via CloudFormation first (see Prerequisite).

## Usage example

https://{your-api-gateway-domain}/demo-test/?id=22

## Prerequisite

This application was created to be deployed by the 'Atlantis CI/CD Pipeline with CloudFormation' developed by Chad Leigh Kluck. Do not proceed unless you have set up an 'Atlantis CI/CD pipeline' for the application in CloudFormation. The pipeline will set up all IAM permissions and introduce you to variables and concepts used within.

It is recommended that you follow the tutorials in the 'Atlantis CI/CD pipeline' README so that you have an understanding of CloudFormation, CodeBuild, CodeDeploy, CodePipeline, and other AWS Services.

Atlantis was developed with training in mind and is not only a useful tool for managing deployments, but is also a wonderful resource for understanding CloudFormation and CodePipeline.

This template can be considered Course #3 of Chad's Steps to Serverless Application Deployment, a set of templates and walk-throughs to help developers learn and deploy serverless while coming away with usable code for their projects. Each of the walk-throughs are available on GitHub.

1. Serverless Introduction (Creating a simple prediction API via AWS CLI using SAM)
2. Deployment Pipelines (Atlantis CI/CD Pipeline with CloudFormation)
3. Creating a Webservice (this)

## Installation

Once you have created a pipeline using Atlantis (see prerequisite) and you have a Code Commit repository, you may begin installation.

For the initial install you will need to complete the following:

1. Install npm modules
2. Update deploy files
    - template-configuration.json (UserAgent, ApiPathBase, and Tags)
    - template.yml (just description to start)
3. Deploy the demo as is (you can later obtain an api key from openweathermap if you want weather)
4. Code your app (once you have a firm understanding of the template code)

### 1. Install npm modules

This project uses the npm [@chadkluck/cache-data](https://www.npmjs.com/package/@chadkluck/cache-data) which provides internal caching for your application. (You'll learn how to use it in tutorial below).

There is already a package.json file so you just need to run the `npm ci` command from within the `app` directory:

```bash
cd app
npm ci
```

If this is your first time using `npm ci` (similar to `npm install` but references the package.json file) you should Google it and see how it differs from `npm install`. And, if you are new to npm, don't worry about it too much right now, but using `install` or `ci` along with gitignore node_modules is the best practice for including *TRUSTED* external packages in your repository. (For why I say and bold TRUSTED in all caps, Google `malicious npm packages`.)

### 2. Update Deploy Files

For deploys, the majority of parameters are set using the CI/CD pipeline. However, there are a few minor adjustments to be made per application:

#### template-configuration.json

- `Parameters` : you can add any parameter settings here. Note you have use of various Variables such as `$DEPLOY_STAGE$` and `$PROJECT_ID$`
  - `UserAgent`: You can modify this for unique identification when checking remote logs. You can always add `$DEPLOY_STAGE$` to identify the stage
  - `ApiPathBase`: If left out, the default is `api` or `Prod` (for CodeStar). Since the auto url is random, you can give a quick name and stage to help identify the application and endpoint. Such as `course-ws-$DEPLOY_STAGE$`

For the tag section of template-configuration.json, leave ProjectStackType, CodeCommitRepo, ProjectStackProjectID, ProjectStackProjectStageID, stage, and env alone. Those are used by the pipeline. However, you may add any additional tags used by your organization.

#### template.yml

Around line 8 update `Description` to fit your needs.

### 3. Deploy demo

You will need to create a branch in your respository that is monitored by a Project Stack Pipeline. Project Stacks creates a deploy pipeline using CloudFormation that automates the deploy process.

To include the weather api in the demo, sign up for a free account and obtain an api key from  an api key from openweathermap.com and store it in `parameterstorepath/apikey_weather` as a secret. Note that you can obtain the `parameterstorepath` by referring to **SSMParameterStore** in the **Outputs** section of the CloudFormation infrastructure stack used by this application.

Go ahead and deploy the template as-is to make sure it works up to this point. Once deployed, the endpoint URL for this application is also listed in the **Outputs** section of the CloudFormation infrastructure stack used by this application.

When you call the endpoint it should display a prediction, a recommended game, and the current weather conditions in Chicago.

### 4. Code your app

In the app folder you will find the following:

- custom/
  - settings.json
- node_modules/
- classes.js
- index.js

index.js, classes.js, and custom/ may be modified to suit your needs.

You are able to create your own Data Access Objects if `endpoint` doesn't suit your needs. More on that later.

#### index.js

The script file index.js contains the handler and main application logic. The template demonstrates collecting data from 3 endpoints (prediction, games, and weather) and combining them into a final API response. Caching for the 3 endpoints is achieved using DynamoDb and S3 by sending requests through dao-cache.js's `CacheableDataAccess` class.

The 3 endpoints are processed simultaneously using async "task" functions. A connection object along with a cache settings object are sent to `CacheableDataAccess` for processing. Once all three tasks are complete the script assembles them into a final response and returns it to the handler which in turn passes the response back to API Gateway.

There are `try`/`catch` blocks that handle any errors. Depending on the severity the script may return an error or empty values. How it reacts is up to you.

- To log debugging outputs make sure the log level is set to 5 and the expiration date has not passed in the line `tools.DebugAndLog.setLogLevel(5, "2021-10-30T04:59:59Z");` near the top of the script. This line should be commented out before moving to production otherwise it will produce a warning in the logs.
- Error logging is available using `tools.DebugAndLog.debug(string, [object])` or `DebugAndLog.warn()`, `DebugAndLog.log()`, `DebugAndLog.msg()`
- Timer logging is available using `const myTimer = new tools.Timer(timerName, true);` and then stopping using `myTimer.stop()`

##### Initialization and Configuration

The variable `CONFIG` is made available during initialization of the application. This occurs during a Lambda Cold Start. The `CONFIG` variable begins initialization at the beginning of the script which is only ran after a cold boot. It is not ran on subsequent executions of the handler. The handler does check to see if the CONFIG variable is finished initializing before continuing. It is typically a 500ms wait after a cold start. After it has been initialized on first run the check and wait is instantaneous and does not halt execution of the handler.

Settings come in three parts which you may reorder as necessary.

1. SSM Parameter Store
2. custom/settings.json
3. Hard coded application settings using logic based on #1 and #2
 - Connection settings to endpoints (with their cache policy)
 - Cache object settings

NOTE: Depending on your needs, you may need to reorganize the order of Parameter Store access and Settings.json loading. If you will be using values from settings to populate additional parameter store locations you'll of course need to load settings.json first.

###### SSM Parameter Store

SSM Parameter Store should be used for any secrets. All api, encrpytion keys and passwords should be stored in SSM Parameter Store and NOT settings.json.

```js
let params = await this._initParameters(
	[
		{
			"group": "app", // so we can do params.app.weatherapikey later
			"path": process.env.paramStorePath // Lambda environment variable
		}
	]
);
```

Note that an encrpytion key is used for cached data marked as `private` and an encrpytion key unique to the application is generated and stored for you on first deploy. If you ever need to change the encryption key, just delete it from the parameter store and re-deploy the application. (The key check and generation is performed in the buildspec utilizing the tools/generate-put-keys.sh script.)

You can add additional keys to the parameter store and they will automatically be brought in as long as they are saved on the application's SSM parameter store path. You can access all the keys for an app using `params.app.varname` within the Config class. You'll need to expose it to the rest of the application using a getter if necessary. There are methods to access other parameter store paths that you application may have access to. Just create an additional object with a different group name and path.

For example, if you created another object where the group name was `cms` and the path was `/myapps/cms/prod/` you might come up with the following and then use something like `params.cms.username` to access the username parameter from `/myapps/cms/prod/username`

```js
let params = await this._initParameters(
	[
		{
			"group": "app", // so we can do params.app.weatherapikey later
			"path": process.env.paramStorePath // Lambda environment variable
		},
		{
			"group": "cms", // so we can do params.cms.username later
			"path":  "/myapps/cms/prod/" // note that this could be something from "settings.json" so it isn't hard coded
		},
	]
);
```

Note that `params` is a local varible to Config during initialization. It may be used to configure other settings during initialization only. If you need to expose certain values to your application you will need to add a getter. Be careful what you expose to your application.

###### Settings

After the parameters are brought in, `settings.json` from the custom directory is brought in. (You may add additional files and import them as you see fit but you want to minimize the amount of time spent initializing during cold starts. With SSM access and the json file load a typical cold start is less than 500ms.) Right now in the demo template there is one file with 3 sections, each brought into `policies`, `settings`, and `referers` respectively. They are in JSON format and are read in using `requires`.

```js
let customSettings = require("./custom/settings.json");

/* You can divide up your custom settings file into sections and separate them out.
Use of policies, settings, and referers are already provided for you.
To create additional sections, add them to settings.json and add them here.
Be sure to create appropriate getters. Use getPolicies() or getSettings() as a template
*/
if ( "policies" in customSettings ) { this.#policies = customSettings.policies; }
if ( "settings" in customSettings ) { this.#settings = customSettings.settings; }
if ( "referers" in customSettings ) { this.#referers = customSettings.referers; }
```

###### Connections and Cache Settings

Finally, connection and cache configurations take place. These typically utilize settings from the settings.json file and SSM Parameter Store. As of now because these take dynamic variables from settings and SSM Parameters they are not able to be called in from files and must be hard coded. This is okay since it provides application structure. You may choose to utilize the settings.json file to store settings for connections.

```js
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
```

The connection settings above are kept quite simple for the example, but the full object is as follows:

```js
const conn = {
	name: "",       // {string} The name to reference when getting connection details in your app
	method: "",     // {string} GET or POST
	uri: "",        // the full uri (overrides protocol, host, path, and parameters) ex https://example.com/api/v1/1004/?key=asdf&y=4
	protocol: "https", // https
	host: "",       // host/domain: example.com
	path: "",       // path of the request: /api/v1/1004
	parameters: {}, // parameters for the query string as an object in key/value pairs
	headers: {},    // headers for the request as an object in key/value pairs
	body: null,     // for POST requests, the body
	note: "",       // a note for logging
	options: {},    // https_get options
}; 
```

Note that `uri` can be a complete uri with protocol, host, path, and query string and will override anything in those fields. You have the option of taking a default connection and then modifying it before passing it for the actual call to the endpoint.

Cache settings are available per endpoint, and each endpoint may have multiple cache settings. The cache setting used is chosen and passed during the actual call.

In the connection object `cache` is an array of cache profile objects. Just like giving your connection a name, you will give your cache profile a name as well that way it can be referenced as you assemble your request.

```js
const conn = { 
	name: "weather",
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
}
```

- **profile**: the name to reference when creating request
- **overrideOriginHeaderExpiration**: If an expiration is given by the endpoint, should we ignore it as we set our own cache expiration? 
- **defaultExpirationInSeconds**: How many seconds should we save the cache?
- **expirationIsOnInterval**: Should the cache expire at set intervals. For example, 3600 seconds in `defaultExpirationInSeconds` will expire on the hour. 86400 will expire at midnight. This is useful if you want scheduled cache expirations. However, if you want cache to be good for x seconds no matter what time of day you can set this to false. (Midnight depends on the overall Cache setting `timeZoneForInterval` mentioned later.)
- **headersToRetain**: A comma delimited list of headers to keep from the endpoint response in case they contain useful data. All other headers are not cached.
- **host**: While it can be a domain name, for logging it can be a human readable "nickname" for the domain. If no host is supplied, the host from the connection will be used.
- **path**: While it can be a regular uri path, for logging it can be a human readable "nickname" for the endpoint path. If no path is supplied, the path from the connection will be used. Note: for security, the full path of the request is not used, just the path listed in the connection.
- **encrypt**: Will the endpoint return sensitive data? If so, set to true. This will also set the cache header to private rather than public. Data will be stored in DynamoDb and S3 in an encrypted state using the key generated during deploy and stored as an SSM parameter.

While each connection can have one or more cache profiles, there are settings for the overall cache. Most of these settings are determined by the environment variables and can be looked at in template.yml for documentation.

However, `timeZoneForInterval` needs to be set otherwise midnight "GMT" will be used for cache interval (`expirationIsOnInterval`) calculations.

It is recommended that `timeZoneForInterval` is set from settings gathered from custom/settings.json and that the remaining settings are left as default or modified using template.yml. 

```js
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
```

Using connections and cache profile in code (refer back to the connection example for games):

```js
// we are going to modify the connection by adding a path
let connection = obj.Config.getConnection("demo");
let conn = connection.toObject();
conn.path = "/games/"; // the conn object only has a domain, we will direct it to the games endpoint

let cacheCfg = connection.getCacheProfile("games");

const cacheObj = await cache.CacheableDataAccess.getData(
	cacheCfg, 
	endpoint.getDataDirectFromURI, // the function from dao-endpoint.js we will use to access original source
	conn, 
	null
);

let games = cacheObj.getBody(true); // true so that we parse it into an object
let body = "";

// as long as we got what we expected, pick a game based on cosmic chance
if( games instanceof Object && "gamechoices" in games && Array.isArray(games.gamechoices) ) {
	body = games.gamechoices[Math.floor(Math.random() * games.gamechoices.length)];
}

resolve( new obj.Response(body, "game") ); // place the body (in this case a string) into a response object with the label "game"

```
#### classes.js

You can extend `ResponseDataModel`, `RequestInfo`, and `_ConfigSuperClass` by adding your own init() logic specific to your application in the classes.js file. It is recommended that if you extend `endpoint` you create separate dao-* files. (I'll explain later.)

The classes `Response` and `Tests` in classes.js are examples of extending the `ResponseDataModel` for collecting and organizing data for a final response.

The class `Request` extends `RequestInfo` and can be used to customize the initialization of the request.

The class `Config`extends `_ConfigSuperClass` and can be used to customize the initialization of Config. As mentioned earlier, Config brings in settings.json, SSM Parameter Store, and sets connections and cache configurations to be used in your application.

### 4. Core Classes and Functions

There are a few classes brought in from the the Node module `@chadkluck/cache-data` that are important to understand in your code.

We'll start with `CacheableDataAccess` as you will be working with that right out of the box. Config and a few other classes were breifly mentioned which should be enough to get you started.

#### `CacheableDataAccess`

You can send requests to your data access objects through `CacheableDataAccess` so that requests to external endpoints (or any datasource) may be cached using DynamoDb and S3. 

You do not need to send requests to an external api uri, you can create your own Data Access Object to retreive data from any number of AWS data sources. You just need to define your DAO and pass a function to `CacheableDataAccess` to use if the cache has expired. Data from an endpoint is only accessed if the cache doesn't exist or has expired which saves on speed and api limits.

Going back to the previous example for defining a request in your code, first we grab the appropriate connection object from the configuration. In this example we are again going to grab the demo api (api.chadkluck.net) and set the endpoint path to `/games/`. This will call `https://api.chadkluck.net/games/` (because host is already set to `api.chadkluck.net`). We could have created a connection for `/games/` so that the path was already set, but in this case we decided to set the path via logic. What if there were a selction of 10 endpoints? What if we had a common apikey to use? Sometimes setting the endpoint in logic helps.


```js
/* note that we already set 
const { tools, cache, endpoint } = require('@chadkluck/cache-data');
const obj = require("./classes.js");
*/

// we are going to modify the connection by adding a path
let connection = obj.Config.getConnection("demo");
let conn = connection.toObject();
conn.path = "/games/"; // the conn object only has a domain, we will direct it to the games endpoint

let cacheCfg = connection.getCacheProfile("games");
```
You'll see that after we grabbed the connection, we needed to separate it out into two parts, the `conn` which holds the access data (host, path, etc), and the cache configuration. For the cache configuration we are able to name the profile we wish to use, in this case, `games`.

Next we send the request through the `CacheableDataAccess` class where `endpoint.getDataDirectFromURI` is the function we will call from dao-endpoint.js if there is no cached data for the request. If there is a cache, and it hasn't expired, `CacheableDataAccess` does not use the function.

```js
const cacheObj = await cache.CacheableDataAccess.getData(
	cacheCfg, 
	endpoint.getDataDirectFromURI, // the function from dao-endpoint.js we will use to access original source
	conn, 
	null
);
```

Finally, we get the body from the data returned by `CacheableDataAccess` with the `true` flag which means we want it back as a parsed JSON object, not a JSON string. (You can use `false` if you are not going to process the data or if you are expecting something other than JSON, such as XML, HTML, or text and you want to do your own parsing).

After we have the body we'll process it and get the information we want to return in our request. In this case we received an array of games, we'll pick one randomly to add to our Lambda function's api response.

Note how in this case we are carefully checking to see that we got what we expected (and not an error from the endpoint). We are expecting an object with a key "gamechoices" that contains an array.

```js
let games = cacheObj.getBody(true); // true so that we parse it into an object
let body = "";

// as long as we got what we expected, pick a game based on cosmic chance
if( games instanceof Object && "gamechoices" in games && Array.isArray(games.gamechoices) ) {
	body = games.gamechoices[Math.floor(Math.random() * games.gamechoices.length)];
}

resolve( new obj.Response(body, "game") ); // place the body (in this case a string) into a response object with the label "game" and hand back to main()

```

#### ResponseDataModel via Response

You can extend ResponseDataModel with your own classes to implement logic in the objects you return. In the previous example where we use an if statement to check our data and then choose a game from an array list, we could have created a `Game` class that extends `ResponseDataModel` (or `Response`) and when constructed, automatically performs the logic in the constructor.

```js
//index.js
let games = cacheObj.getBody(true); // true so that we parse it into an object

resolve( new obj.Response(games, "game") ); // place the body (in this case a string) into a response object with the label "game" and hand back to main()

```

This would have cleaned up the task function by just supplying the connection and cache access, and then put any data processing into the `Game` class.

```js
//classes.js
class Game extends tools.ResponseDataModel {

	/**
	 * 
	 * @param {Response|*} data Default structure along with any declarations of arrays or objects and default values.
	 * @param {string} label A label or key to use when added to another Response object or sent as a response
	 */
	constructor(data) {
		super("", "game");

		let game = "";

		if( data instanceof Object && "gamechoices" in data && Array.isArray(data.gamechoices) ) {
			game = data.gamechoices[Math.floor(Math.random() * data.gamechoices.length)];
		}

		super._responseData = game;

	};

};
```

In the end, when we export the Game object using toObject() or by passing it to .addItemByKey() we end up with:

```json
{
	"game": "Tic-Tac-Toe"
}
```

Where the key "game" came from the label we passed as a string, and the string "Tic-Tac-Toe" came from the random list of games. (Typically it is an object such as you'll see with `weather`)

You can think of Response objects as individual datapoints made up of smaller data points. If you are compiling several data points into a single datapoint then you can add each Response object to a larger aggregate Response object. In our case we are going to return a response object comprised of 

```json
{
	"game": "",
	"prediction": "",
	"weather": {}
}
```

We can contact each of the 3 endpoints simultanously and add them into the structure based on the key/label each task provided for it's response object. (Remember we set Game as "game" in the constructor of `Game` or, if using `Response` set the second parameter as "game").

So our main() code looks like this:

```js
/* Tasks - We will be calling multiple APIs simultainously. */
let appTasks = []; // we'll collect the tasks and their promises here

appTasks.push(taskGetGames());
appTasks.push(taskGetPrediction());
appTasks.push(taskGetWeather());

// this will return everything promised into an associative array
let appCompletedTasks = await Promise.all(appTasks);

const dataResponse = new obj.Response();

// Utilize the key/labels from the ResonseDataModel objects to place in response JSON object
for (const item of appCompletedTasks) {
	tools.DebugAndLog.debug("Response Item",item);
	dataResponse.addItemByKey(item);
};

// create the response API Gateway expects
let response = {
	statusCode: 200,
	body: dataResponse.toString(),
	headers: {'content-type': 'application/json'}
};

resolve(response);

```

Example output: (note how "game" and "prediction" were just strings, but our "weather" data is a full object):

```json
{
  "game": "Black Jack",
  "prediction": "My reply is no",
  "weather": {
    "coord": {
      "lon": -87.65,
      "lat": 41.85
    },
    "weather": [
      {
        "id": 501,
        "main": "Rain",
        "description": "moderate rain",
        "icon": "10d"
      }
    ],
    "base": "stations",
    "main": {
      "temp": 74.35,
      "feels_like": 74.73,
      "temp_min": 66.34,
      "temp_max": 78.87,
      "pressure": 1005,
      "humidity": 69
    },
    "visibility": 10000,
    "wind": {
      "speed": 4,
      "deg": 218,
      "gust": 7
    },
    "rain": {
      "1h": 1.59
    },
    "clouds": {
      "all": 90
    },
    "dt": 1633980671,
    "sys": {
      "type": 2,
      "id": 2005153,
      "country": "US",
      "sunrise": 1633953510,
      "sunset": 1633994140
    },
    "timezone": -18000,
    "id": 4887398,
    "name": "Chicago",
    "cod": 200
  }
}
```
#### RequestInfo via Request

For a full list of functions check out the documentation in tools.js for RequestInfo.

We can create a constant `REQ` and use it throughout our application during a request. Make sure you set the proper scope, it needs to be within the function that is called by the handler and not Global. 

```js
/* Note that obj represents classes.js and Request extends RequestInfo
const obj = require("./classes.js");
*/
const REQ = new obj.Request(event);
```

Now, from the `REQ` variable we have access to methods such as `REQ.isValid()`, `REQ.getClientUserAgent()`, `REQ.getClientIP()` and more.

If we want to check if it is a valid request, the demo returns the value of `REQ.isValid()` for `init()`.

```js
// (near bottom of index.js)

let isValid = init();

if (isValid) {
	functionResponse = await execute();
} else {
	functionResponse = generateErrorResponse(new Error("Invalid request", "403"));
}
```

`init()` could actually be avoided and we could just create a new class that extends RequestInfo, or modify Request to perform the full initialization and store it in `REQ`.

Moving as much code and logic out of index and to Response, Request, and Config classes is recommended.

#### _ConfigSuperClass via Config

We went over this in detail previously, but want to reiterate that you can reorder operations and bring in additional initialization logic for the application settings within Config using the underlying _ConfigSuperClass.

The main purpose of Config is to store your connection and data cache settings as well as your other application settings. Use settings.json as much as possible to save your configurations and create additional getters as needed.

## CloudWatch logs and Dashboard

When deployed to a production environment (the value of `PROD` was passed to `DeployEnvironment` in template.yml) a dashboard will be created. The dashboard is defined in template.yml and by default contains basic execution information such as number of invocations, number of errors, recent logs, and cache status.

Of particular interest is the cache data since this template is most likely used because you want to perform caching.

Every time data is requested using `CachableDataAccess` a log entry is produced which states the type of data requested and whether cache our original source was used.

```text
[CACHE] ae17b4f2daf6d6ea31d60ab1d36da60b236451bf77d5d125558057a6a8f7cebe | example/person | cache | 180
```

In the above example, we see a cache log entry (denoted by `[CACHE]`) the cache id, source (domain/path nickname from cache profile), that cache was used, and it took 180ms to retreive. 

The cache ID is a hash of unique headers (including api keys), the full path, query string, and anything else that makes it unique compared to other requests. Note that the following will be classified as two different requests for security reasons:

```text
GET https://example.com/api/v1/person/833xzy headers {"x-api-token": "as79bns9sauzw"}
GET https://example.com/api/v1/person/833xzy headers {"x-api-token": "ub8n2l4h3smky"}
```

Even though they are to the same endpoint, the `x-api-token` does not match and will result in a different hash id.

In our example also note that the log entry has the nickname `example/person` to identify the connection used. It could just as easily list `example.com/api/v1/person` if we didn't supply a host/path nickname for the cache. Nicknames come in handy when looking at the log and grouping like reqeusts.

The dashboard will list most requested data, how often the cache is used, response time, etc. You'll want to adjust your cache expirations based on the data regarding how often cached data is used, how often you expect it to change, and how important it is to receive the most up to the second information.

Similar to Cache logs, there are also `[RESPONSE]` logs similar to what you would get in web logs. There are also `[ERROR]` and `[WARN]` logs.

Debugging using `DebugAndLog.debug()` is not allowed in production and those statements are ignored and not logged. Same with diagnostics such as timers. However, if you set your logging level higher than the allowed level for production, you will receive a warning on each cold start. It is recommended you comment out any elevation in log level before releasing it to production.

```js
// index.js

/* increase the log level - comment out when not needed  */
tools.DebugAndLog.setLogLevel(5, "2021-10-30T04:59:59Z"); // we can increase the debug level with an expiration

```

## Creating your own DAO instead of using `endpoint`


You may create additional Data Access Objects unique to your endpoints by creating a dao-_something_.js file and using the contents of [dao-endpoint.js](https://github.com/chadkluck/cache-data/blob/main/src/lib/dao-endpoint.js) as a template (available from the cache-data module available on GitHub). The `endpoint` object (defined in dao-endpoint.js) is a generic call to a remote endpoint, but, if you want to add basic logic to structure all your requests for a particular data type from a particular endpoint you may use dao-endpoint.js as a template.

Why would you do this? Perhaps you have an endpoint from a vendor (ACME) and on every request you need to append `format=json`. You could put that in your settings, or if you have lots of additional logic (such as 100 record limits per request but you want to perform the pagination automatically before returning data to your application) you could just define your own dao object in `dao-acme.js`.

Instead of using `endpoint` you would then use `acme`:

```js
/*
// assuming we imported dao-acme.js into the variable acme using:
const acme = require("dao-acme.js");
*/

const cacheObj = await cache.CacheableDataAccess.getData(
	cacheCfg, 
	acme.getDataDirectFromURI, // instead of endpoint, we'll use our custom acme data access object
	conn, 
	null
);
```

## Tutorial

It is expected that you have some understanding of serverless functions in Lambda and that you are using the Project Stack development pipeline template.

This tutorial also relies on at least a brief going over of the previous examples in this READ ME so that you have some understanding of how this works.

Now, let's extend this demo-template application!

As you note, this application returns data from three endpoints. A recommended game, a prediction of whether you will win or loose, and the current weather conditions for Chicago, Illinois. Let's extend this api so that our endpoint can take a location from the client and return the weather for that location.

We'll accomplish this accepting a location parameter from the query string and passing the location parameter to the weather api.

Before you proceed, you will need to set up a key in parameter store for Open Weather Map if you have not already done so. Please refer to **Installation - 2. Deploy** for instructions on obtaining and installing a key in parameter store.

After you have verified that your api key is working (just runing the script will validate, either you see current conditions in Chicago, or a message that you need an api key) we will do the following:

1. Update the weather task to send a query string parameter to the weather api
2. Look at the CloudWatch log files and see how the internal cache works
3. Log the cities requested

### 1. Accept a query string parameter for location

What does the weather in Chicago have to do with your gameplay? Probably very little so let's allow our API to accept any valid location. (Valid locations are subject to Open Weather Map)

Remember the Request class is our custom implementation that extends RequestInfo. RequestInfo has a lot of ready to use functions, one of which will obtain the query string parameters from the request received by API Gateway and passed on to Lambda through the `event` variable. Request parses out the event variable and provides various getters, one being `.getClientParameters()`.

```js
// at the beginning of the index.js file we call in the classes.js
const obj = require("./classes.js");

// ... and futher down, in the processRequest() function...
const processRequest = async function(event, context) {

	// ... we construct REQ as a Request object
	const REQ = new obj.Request(event);
	
	// ... we can now get information about the request using functions such as
	let params = REQ.getClientParameters();
}
```

The function `.getClientHeaders()` is also available.

So, we'll want to check for a parameter with the key of "q" and use it instead of the default value of "Chicago" currently loaded into our weather Connection from settings.

In index.js, go to the `taskGetWeather()` function and look at the following piece of code:

```js
let connection = obj.Config.getConnection("weather");
let conn = connection.toObject();
// conn.path = ""; // we will just use the path set in the connection details
```

We'll add code to check if a `q` parameter was passed and, if so, substitute the current value of `q` with the passed value. The above code should now look like this:

```js
let connection = obj.Config.getConnection("weather");
let conn = connection.toObject();
// conn.path = ""; // we will just use the path set in the connection details
if ( "q" in REQ.getClientParameters() ) {
	conn.parameters.q = REQ.getClientParameters().q;
}
```

**One final step before deploy!** Near the top of index.js, change the DebugLevel to 0 so we have clean logs to look at. (Or comment that line out. For a full explaination of debug levels, view the comment documentation in tools.js)

```js
tools.DebugAndLog.setLogLevel(0, "2021-10-30T04:59:59Z"); // we can increase the debug level with an expiration
```

Save and commit your changes to the repository and wait for the deploy to complete.

Once the deploy is complete, go to your endpoint and add on `?q=Seattle` and verify that the current conditions for Denver, CO appears. (You can also go to your CloudFormation stack for the app infrastructure and under Outputs find a test URL with ?q=Chicago where your can update the value of q after clicking on it.)

Also try:

- Seattle
- Colorado+Springs

What happens if you try `Seetle` (mis-spelling intended).

Do `Seattle` (with correct spelling) again and hit refresh one or more times as we'll want to check the logs to make sure the cache is working.

### 2. Check CloudWatch logs

Go to CloudWatch Log groups and find the log group associated with your deployment.

Find the latest log entries and open them.

You should see entries similar to the following:

```text
START RequestId: 2c6452bf-fdfb-48db-8578-b03633e4b829 Version: $LATEST
INFO [COLDSTART] 451
INFO [CACHE] 1852a1dea756b2941e0ab4acddbdd39a205c6ab6c8e8f673009b854b4f2fd99f | weather/default | cache | 182
INFO [CACHE] fe4f978de5a44dbb8553ed12ebe0e5456dbbfd33d30101cb0deee69b0173085f | demo/games | cache | 499
INFO [CACHE] edd7e7a315c8d83fce1d85e56980614369bd819bafbd88cd2d1526b5e95ce0f0 | demo/prediction | original:cache-expired | 800
INFO [RESPONSE] 200 | 940 | 140.209.60.103 | Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0 | |
END RequestId: 2c6452bf-fdfb-48db-8578-b03633e4b829
REPORT RequestId: 2c6452bf-fdfb-48db-8578-b03633e4b829 Duration: 1474.45 ms Billed Duration: 1475 ms Memory Size: 128 MB Max Memory Used: 83 MB Init Duration: 568.40 ms	
```

Aside from the Lambda START, END, REPORT entries, you should see `[COLDSTART]`, `[CACHE]`, and `[RESPONSE]` entries.

A COLDSTART entry occurs during a cold start which could be after your application has been dormant after a certain period of time, or is in high demand with multiple instances coming online. Not only can the Coldstart entries be counted to see how often they happen, but the number of milliseconds set aside for Config initialization (getting of SSM Parameters and reading in the settings.json file) is also noted. The amount of time it took for Lambda to do its part of the cold start is actually listed in the first REPORT following a cold start under the label Init Duration. Init Duration + your Config init = total init.

So, if your COLDSTART was 451ms and Lambda Init Duration was 568ms, then the total cold start was 1019ms (or 1.019 seconds).

Next you'll see 3 CACHE entries, each listing their nickname so you can identify them as "weather/default", "demo/games", and "demo/prediction". As you scroll down you'll see some also list cache information such as "original", "cache", "original:cache expired" and so on. As you may have seen from the Config section, we cache the list of games for a certain amount of time as the list doesn't change and there is no reason to call it each time. We can just grab the list from the cache until the cache expires.

The number at the end of a cache log notes the number of milliseconds it took to fullfill the request. Check out the difference between using the cache or calling the original. If you do not have any original "weather/default", go back to your browser and grab the weather for a city you hadn't looked up yet, such as `New+York` or `Denver` or `Miami` or `Omaha` or `Minneapolis` and go back to the logs (make sure they auto update).

Finally, the RESPONSE log entry lists all kinds of useful information about the request such as status returned, number of milliseconds to complete, IP address, user agent, and referer and origin if there was one.

If there were any ERRORS or WARNS they would also be logged here.

If you set the deploy environment to `PROD` then there is also a dashboard with graphs allowing you to visualize the number of cached requests.

These logs can be useful, but what if you wanted to know what cities clients request the weather for?

### 3. Add cities to the response log

We are going to update the Request class to keep track of the cities requested and send that data to the logs. We'll also need to update the dashboard and add a metric.

Go into classes.js and add the following method to the Request class:

```js
	/**
	 * Get the city for weather information if provided in the query string
	 * @returns {string} City requested, '-' if no city provided
	 */
	getCityFromParameters() {
		let q = "-";

		let params = super.getClientParameters();

		if ( "q" in params ) {
			q = params.q;
		}

		return q;
	};
```

As you see it is very similar to what we used earlier, except we are calling `.getClientParameters()` only once which is good practice.

This will return the city requested from the query string or "-" if no city was requested in which case the default (Chicago) will be used. It is useful to know if clients actually requested `Chicago` or just used the default.

Next, we need to update the Log class. Again in classes.js, go to the Log class and update the response() method by adding another logFields.push() between the entry for elapsed and getClientIP().

```js
logFields.push(elapsed);
logFields.push(request.getCityFromParameters()); // add this line
logFields.push(request.getClientIP());
```

You can always modify the log entries by adding additional datapoints using this method.

Finally, we need to update the dashboard as it expects a particular layout.

In template.yml go to the Dashboard section and do a find/replace for the following (there should be 1 instance)

`PARSE @message \"[*] * | * | * | * | * | *\" as loggingType, statusCode, execTime, clientIP, userAgent, origin, referer`

Replace with

`PARSE @message \"[*] * | * | * | * | * | * | *\" as loggingType, statusCode, execTime, city, clientIP, userAgent, origin, referer`

And replace the following (there should be one):

`DISPLAY ts, statusCode, execTime, clientIP, userAgent, origin, referer`

With

`DISPLAY ts, statusCode, execTime, city, clientIP, userAgent, origin, referer`

For more information on CloudWatch Dashboard queries you'll need to refer to online documentation. Basically what we did here was add another field. Note that we now added one more `| * ` to parse and we added `city` to the field name and Display list.

Now we want to deploy this and check our work. Note that unless you are deploying to a `PROD` environment (as specified in your Project Stack deploy pipeline) you will not have a dashboard created. However, for this example you could comment out the Condition line for Dashboard in template.yml:

```yaml
  # -- CloudWatch Dashboard --
  Dashboard:
    Type: AWS::CloudWatch::Dashboard
    #Condition: CreateProdResources
    Properties:
      DashboardName: !Sub '${Prefix}-${ProjectStageId}-Dashboard'
```

You will want to uncomment and re-deploy before you are done for the day, or delete the tutorial stack all together so that you are not charged.

Deploy.

After deploy try a few cities.

- ?q=Chicago
- ?q=Denver
- ?q=Seattle
- ?q=Miami
- ?q=Denver
- ?q=Colorado+Springs

Then try a few without a query string.

Go back to CloudWatch logs and check the latest. You should now see that the city is included in the RESPONSE log.

Let's add a metric to the dashboard. This will require a little but of json editing within yaml so it could be tricky. Spacing and bracket order is important.

Go back to the Dashboard section in template.yml and find the end of the Dashboard json.

```text
				{
                    "height": 6,
                    "width": 18,
                    "y": 63,
                    "x": 0,
                    "type": "log",
                    "properties": {
                        "query": "SOURCE '/aws/lambda/${AppFunction}' | fields @timestamp as ts, @message, @logStream as logStream\n| sort ts desc\n| limit 100\n| PARSE @message \"[*] *\" as loggingType, ms\n| FILTER (loggingType = \"COLDSTART\")\n| DISPLAY ts, ms, logStream",
                        "region": "${AWS::Region}",
                        "stacked": false,
                        "title": "Init after Cold Start",
                        "view": "table"
                    }
                }
            ]
        }
```

Add a comma and a return line after the third bracket from the bottom so it now looks like this but without the comment:

```text
				{
                    "height": 6,
                    "width": 18,
                    "y": 63,
                    "x": 0,
                    "type": "log",
                    "properties": {
                        "query": "SOURCE '/aws/lambda/${AppFunction}' | fields @timestamp as ts, @message, @logStream as logStream\n| sort ts desc\n| limit 100\n| PARSE @message \"[*] *\" as loggingType, ms\n| FILTER (loggingType = \"COLDSTART\")\n| DISPLAY ts, ms, logStream",
                        "region": "${AWS::Region}",
                        "stacked": false,
                        "title": "Init after Cold Start",
                        "view": "table"
                    }
                },
				// you'll paste the next piece of code here!
            ]
        }
```

Now, where the temporary comment above is located, paste in the following:

```text
				{
                    "height": 2,
                    "width": 24,
                    "y": 69,
                    "x": 0,
                    "type": "text",
                    "properties": {
                        "markdown": "## Request Information\n\nQuery fields."
                    }
                },
                {
                  "height": 4,
                  "width": 12,
                  "y": 71,
                  "x": 0,
                  "type": "log",
                  "properties": {
                      "query": "SOURCE '/aws/lambda/${AppFunction}' | fields @timestamp as ts, @message\n| limit 500\n| PARSE @message \"[*] * | * | * | * | * | * | *\" as loggingType, statusCode, execTime, city, clientIP, userAgent, origin, referer\n| FILTER (loggingType = \"RESPONSE\")\n| stats count(*) as requests by city\n| sort requests desc\n",
                      "region": "${AWS::Region}",
                      "stacked": false,
                      "title": "Requests",
                      "view": "table"
                  }
                }
```

Deploy and after the deploy is complete, go to the dashboard and spend some time exploring it.

As you scroll down the page you'll see many graphs and tables with useful information about the performance of you application. Invocations, durations, memory use, cache utilization, and more. At the very bottom you'll see the **Request Information** section we added where we created a count for the query field City. 

For each widget you can hover over the title and from the three dots, choose Edit to look at the query behind the chart or table. As you look at the code behind each widget you should be able to see the connections to the JSON for the dashboard in the template.yml file. Feel free to play around with the code in the widget, any changes you make to the dashboard will be undone the next time you deploy. Just like with any AWS service deployed through CloudFormation, all changes must be made in the template and application repository in order to be kept after each deploys.

Eventually, when you have an application in production and wish to gain more insight you will be ready to produce logs you can export into other products.

That's it! What's next?

It is recommended you familiarize yourself with the following files:

- template.yml
- app/classes.js
- app/index.js

And these files from [npm @chadkluck/cache-data source GitHub](https://github.com/chadkluck/npm-chadkluck-cache-data):

- src/lib/
  - dao-cache.js
  - dao-endpoint.js
  - tools.js

### Bonus

For this bonus tutorial we will update the CloudFormation template for the CI/CD pipeline. We will then add additional insights such as AWS X-Ray and Lambda Insights which can assist you in troubleshooting and viewing issues as they arise.

Before diving into these next steps, read through the information on [X-Ray](https://aws.amazon.com/xray/) and Lambda Insights(https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights.html). Note that there may be costs associated with them, and you can remove them from your application's template once you have completed this bonus exercise.

Did you read through some of the information on X-Ray and Lambda Insights? Are you ready to see them in action?

#### Modify the CI/CD Pipeline in CloudFormation

First, we need to grant our application's CloudFormation template the ability to add a Lambda Layer for Lambda Insights when it deploys. Since permissions for what resources our CloudFormation application infrastructure stack can create are in turn given by the CloudFormation deploy pipeline stack, we need to modify the deploy pipeline to grant those permissions.

Go into CloudFormation via Web Console and find the deploy stack for your application (yourapplication-test-deploy). If you have multiple deployments, choose one to test with, but not a PROD environment one as it won't deploy All At Once like a development or test branch would.

Once you click on it, go to the Template tab.

This is the template that was loaded as the toolchain to create your deploy stack. Because it doesn't deploy via it's own pipeline like our application does, we need to modify the existing template, or upload a new one. (If we had a pipeline to deploy a pipeline, it would just be turtles all the way down!)

Luckily we can update the template through the web console by clicking on the Update button in the upper right.

Choose "Edit template in designer" and then "View in Designer"

You'll notice a graphical schematic that tries its best to reprsent the structure of the CloudFormation stack. Below it is the template in YAML which you can edit.

Scroll down to `CloudFormationTrustRole` and around line 284 under the `CloudFormationRolePolicy` statements you will find the permissions to create lambda and dynamodb resources.

```yaml
          - Action:
            - lambda:*
            Effect: Allow
            Resource:
            - !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${Prefix}-${ProjectStageId}-*'
            
          - Action:
            - dynamodb:*
            Effect: Allow
            Resource:
              - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${Prefix}-${ProjectStageId}-*'
```

Insert the following between the two Actions (make sure you keep the proper indents since YAML relies on it!):

```yaml

          - Action:
            - lambda:GetLayerVersion
            Effect: Allow
            Resource:
            - 'arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:*'
```

You should now have the following which grants your application infrastructure stack the ability to get a Lambda Layer version:

```yaml
          - Action:
            - lambda:*
            Effect: Allow
            Resource:
            - !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${Prefix}-${ProjectStageId}-*'

          - Action:
            - lambda:GetLayerVersion
            Effect: Allow
            Resource:
            - 'arn:aws:lambda:${AWS::Region}:580247275435:layer:LambdaInsightsExtension:*'

          - Action:
            - dynamodb:*
            Effect: Allow
            Resource:
              - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${Prefix}-${ProjectStageId}-*'
```

But wait! What is that AWS account ID? It's not yours!

That's okay, and if you want to verify that it is okay, you can check out [AWS's own documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versionsx86-64.html). It is okay because it is a Lambda Layer provided by AWS and that account number is theirs. That's the cool (and scary if not used right) thing about AWS permissions, you can provide access to resources on your account to others. You can be restrictive and only allow certain accounts, and certain applications on certain accounts, access to resources, or you can be openly permissive and provide public access to resources you want publicly accessible. Like zipped, publicly available code files on S3.

Note: Check the account number for your region. While 580... is the number used in most regions, it will differ in some regions outside the U.S. You can use the documentation link provided in the previous paragraph.

Next, click on the Cloud icon (Create stack) in the upper left corner to save your changes.

You will be shown through several screens asking if you want to change any parameters. We won't at this time, but go ahead and read them as you click through to the end and don't forget to check the box before the final save. 

The stack will reform and we are now set to update our application.

However, before we modify our application, I just wanted to let you know that this is how you can add permissions for your CloudFormation application infrastructure stack to create additional resources beyond S3, DynamoDb, CloudWatch dashboards, and Lambda. You just need to add the proper policy statement to the `CloudFormationRolePolicy`.

#### Modify your Application template.yml

Go to template.yml for your application and scroll down to the Lamda configuration.

Add the following before Environment:

```yaml
      # Lambda Insights and X-Ray
      Tracing: Active # X-Ray
      Layers:
        - !Sub "arn:aws:lambda:${AWS::Region}:580247275435:layer:LambdaInsightsExtension:21" 
        # Check for latest version: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versionsx86-64.html
```

You'll need to check the latest version link to verify that the version (21 in this case) is available in your region. (Also be sure to double check the account number)

Next, you'll need to add permission to the Lambda Execution Role.

Between `AssumeRolePolicyDocument` and `Policies`, add:

```yaml
      # These are for application monitoring
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy'
        - 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
```

You should now see something like:

```yaml
      AssumeRolePolicyDocument:
        Statement:
        - Effect: Allow
          Principal:
            Service: [lambda.amazonaws.com]
          Action: sts:AssumeRole

      # These are for application monitoring
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy'
        - 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'

      # These are the resources your Lambda function needs access to
      # Logs, SSM Parameters, DynamoDb, S3, etc.
      # Define specific actions such as get/put (read/write)
      Policies:
      - PolicyName: LambdaResourceAccessPolicies
```

That's it! Commit your changes to the branch you updated the CloudFormation pipeline stack for.

As we wait for it to deploy I'll mention that we only changed one deploy pipeline. If you have multiple deploy pipelines you'll need to go through the web console and change each. Also note that you are able to change the parameter settings the same way.

Once the application has deployed go ahead and run a few tests by accessing the endpoint in the browser like you did before. (There should be an endpoint test link available in your application infrastructure CloudFormation stack Output section.)

For variety you can try the same cities as before or add your own:

```
?q=Chicago
?q=Denver
?q=Seattle
?q=Miami
?q=Denver
?q=Colorado+Springs
```

After a few tests, go to your Lambda application in the web console and go to the monitoring section. There you will find buttons for Insights and X-Ray. First go into Insights and notice the charts available such as CPU utilization and error rates.

Go back to the Monitoring tab on your lambda function and click on the X-Ray button. 

X-Ray takes samples of your application invocations so not every one will be listed, but you should be able to gain insight into how your application handles requests.

Exploring how to use X-Ray and Insights is beyond this tutorial, but use the links provided earlier.

If you wish to remove X-Ray and Lambda Insights from your application, go into your template.yml file and comment out (or delete) the lines we added:

```yaml
#      Tracing: Active # X-Ray
#      Layers:
#        - !Sub "arn:aws:lambda:${AWS::Region}:580247275435:layer:LambdaInsightsExtension:21" 
```

And the policy:

```yaml
#      ManagedPolicyArns:
#        - 'arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy'
#        - 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
```

You may also go back to the deploy pipeline stack and remove the permissions to access the layer version, but if this is not a real production application then it is unnessary.

I hope this bonus section gave you insight on how to modify your deploy pipeline stack and introduce you to X-Ray and Lambda Insights to help you monitor your application!
