# Alternate Method for Retrieving SSM Parameter Store Values

> NOTE: The `AWS-Parameters-and-Secrets-Lambda-Extension` layer is provisioned out of the box in the application's CloudFormation template and Configuration initialization. The method described below is an alternative to using the extension.

This alternative method can be used if the provided Lambda Extension does not meet your needs. While the extension creates a server connection, this alternative method uses the AWS SDK API.

Reasons why you might need this alternate method:

1. Local development - As of now the application can't seem to run the extension locally
2. Your organization doesn't allow extensions developed and hosted by outside parties (this extension was developed and is hosted by AWS if that helps)

This alternative method was retired and replaced by the extension in May 2024 when it began to consistently error out, thereby prevent any Lambda execution from utilizing the parameters. It was replaced by the extension because the extension is reputable, maintained by AWS, and more reliable.

With all that being said, if you need an alternate method of retrieving parameters from parameter store, here it is.


## SSM Parameter Store

SSM Parameter Store should be used for any secrets. All api, encryption keys and passwords should be stored in SSM Parameter Store and NOT settings.json.

```js
let params = await this._initParameters(
	[
		{
			"group": "app", // so we can do params.app.weatherapikey later
			"path": process.env.paramStore // Lambda environment variable
		}
	]
);
```

Note that an encryption key is used for cached data marked as `private` and an encryption key unique to the application is generated and stored for you on first deploy. If you ever need to change the encryption key, just delete it from the parameter store and re-deploy the application. (The key check and generation is performed in the buildspec utilizing the tools/generate-put-keys.sh script.)

You can add additional keys to the parameter store and they will automatically be brought in as long as they are saved on the application's SSM parameter store path. You can access all the keys for an app using `params.app.varname` within the Config class. You'll need to expose it to the rest of the application using a getter if necessary. There are methods to access other parameter store paths that you application may have access to. Just create an additional object with a different group name and path.

For example, if you created another object where the group name was `cms` and the path was `/myapps/cms/prod/` you might come up with the following and then use something like `params.cms.username` to access the username parameter from `/myapps/cms/prod/username`

```js
let params = await this._initParameters(
	[
		{
			"group": "app", // so we can do params.app.weatherapikey later
			"path": process.env.paramStore // Lambda environment variable
		},
		{
			"group": "cms", // so we can do params.cms.username later
			"path":  "/myapps/cms/prod/" // note that this could be something from "settings.json" so it isn't hard coded
		},
	]
);
```

Note that `params` is a local variable to Config during initialization. It may be used to configure other settings during initialization only. If you need to expose certain values to your application you will need to add a getter. Be careful what you expose to your application.

## Connections and Cache Settings

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
