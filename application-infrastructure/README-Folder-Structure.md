# Application Directory and File Structure

It is recommended you keep this README in your application-infrastructure directory as reference for you and others who are maintaining the application.

The original (and updated) document for this README may be found on the [web service template GitHub site](https://github.com/chadkluck/serverless-webservice-template-for-pipeline-atlantis).

## Application Infrastructure

`/application-infrastructure`

Contains the build and deploy specifications for the application infrastructure.

This directory should be included in the root of your repository as the Pipeline expects this directory to contain the necessary files to build and deploy your application infrastructure. The basic README, LICENSE, and CHANGELOG as well as other non-build/deploy documents should be stored outside of this directory. (You may always include additional READMEs as necessary within this directory and it's sub-directories.)

### Build Spec YAML file

`buildspec.yml`

Uses environment variables and scripts to build the project and assemble the artifacts. In addition to Bash commands, custom Python and Node scripts used during the build process may be stored in the build-scripts directory.

It should be written in a way to accommodate all deployment environments (dev, test, prod) so that there is only one buildspec. Use environment variables and template parameters to your advantage in constructing (and self-documenting) the differences in environments.

### Build Scripts directory

`build-scripts/`

Any custom Python, Node, or Bash scripts to assist in the build process. 

The bash script `generate-put-keys.sh` checks for the existence of required SSM parameters used by the application. If they don't exist, it creates them with either a default value set to `BLANK` or a generated app specific random string that can be used for hashing, encrypting, signing, or other crypto function.

### template YAML files

- `template.yml`
- `template-swagger.yml`
- `template-dashboard.yml`

The main CloudFormation template is template.yml but it can be broken down into smaller templates that are included during CloudFormation deployment. Templates for Swagger and Dashboards can get quite long so they can be stored in `template-swagger.yml` and `template-dashboard.yml` respectively.

#### Swagger Template

The Swagger template helps define and create the API Gateway resource by defining endpoints, query and header parameters, and response structure. After deployment, a Swagger document can be downloaded from API Gateway and imported into API development tools such as Postman. This helps in documenting the endpoint provided by your application.

If you are not using API Gateway as a trigger for your Lambda function, then the Swagger Template can be removed.

#### Dashboard Template

The Dashboard template defines the widgets that will be included in the CloudWatch dashboard so you can monitor your production environment. Typically dashboards are only created in PROD environments as they cost money and are not necessary for testing. The dashboard can contain monitoring graphs, tables, and logs for metrics such as error rates, cache rates, and traffic.

If you are creating a Lambda function that doesn't require a dashboard (such as a dev-ops process or "cron" job), then the Dashboard Template can be removed.

### template configuration JSON file

`template-configuration.yml`

The Template Configuration file can be thought of as a shim between the Parameter Overrides provided by Deploy (either CodeDeploy in a pipeline or `sam deploy` `samconfig.toml`) and the Parameter defaults in this application's template.yml file. It also holds the Tags to be applied to all the resources created by the application's infrastructure template.

While some parameter values may be specified in a deploy's overrides, you may wish to change the remaining defaults. You can either hard-code values or utilize variables available in the Build environment.

To utilize variables, make sure the variable is either available in the Build environment, or generated during the build process. The variable in `$VARIABLE$` format (Variable name with `$` at start and end) should be included as the value in the configuration file and have a corresponding search/replace in the buildspec file during the execution of the `sed` command.

### SAM Config TOML file

- `sample-samconfig.toml`
- `samconfig.toml` (after copy)

This file is used when deploying the application using the SAM CLI such as during local development (using the `sam build` and `sam local start-api` command) and simple, manual deployments (`sam build` and `sam deploy`) that don't require an automated, multi-branch, CI/CD CodePipeline.

A sample file (`sample-samconfig.toml`) is provided by default and can be downloaded from this template project's repository. You can modify and store the sample file in your repository with basic information that can be used by other developers. To use it locally, save a copy as `samconfig.toml` (it will be ignored by GIT as long as `samconfig.toml` remains in the `.gitignore` file).

### Public directory

`public/`

If you have static files to host in S3 you can place them in the public directory and then add the S3 sync command (`aws s3 sync`) to the list of commands in buildspec.yml. Note that that the S3 bucket must already exist outside of your application's CloudFormation template.

## App or Src directory

`app` or `src`

Whether it is `app` or `src`, it needs to be reflected in the buildspec during the `npm install`, artifact creation, and referenced by the Lambda's `CodeUri` attribute in `template.yml`. `src` is traditional, but may not accurately reflect the contents as it relates to Lambda functions and layers.

This directory stores the code for one or more Lambda functions and/or layers.

The following documentation goes over structure for a single Lambda function written in Node.js using the "Model, View Controller" design pattern, though any language, number of functions, and combination may be used with a slightly different structure.

### Index and Handler JavaScript File

`index.js`

This is the entry point to your Lambda function and contains the function initialization (during Cold Starts) and any handlers.

The handlers should be kept simple, check to make sure initialization is complete, and then immediately hand off to the Router. Several handlers may be defined and then referenced by different endpoints in the Lambda API Event section in the CloudFormation template.

Note that using API Gateway and API Events in the template negate many of the features some frameworks such as Express provide. Authentication and response models can be handled by API Gateway, and introductory routing based on endpoint path can be defined in your Lambda CloudFormation template.

When an instance of a Lambda function is invoked for the first time there will be a Cold Start. All initialization that is required and shared by all subsequent invocations should be performed before the handler. This includes database connections, secrets gathering, and parsing of settings files.

The Config initialization is performed asynchronously, so there should be a Promise check (make sure promises are resolved) using an `await` before proceeding in the handler.

The handler should have a basic `try`/`catch`/`finally` block. The `try` block should pass the `context` and `event` to the Router.

### Routes directory

`routes/`

The `routes` directory receives the context and event information from the handler and then determines where to route the request. 

To do this, a `Request` object is created from the event and context. The `Request` object is a class that can be defined in Utils. Custom code can take information from the event and context and apply general business logic that can be used to inform the router of what route to send the request through. The business logic handled by the Request object should be very general and intended to be utilized by the Router and most downstream methods. Resource intensive tasks should be handled by the controller which can handle multiple tasks asynchronously.

Using a `switch` or `if-if-else-else` block, the Router sends the Request object to the proper view that will next process the request.

There should only be ONE route and subsequently, ONE view. Much like a web page can have multiple content pieces (some shared among other web pages) there is still only ONE web page. 

### Views directory

`views/`

A view assembles and formats the end result (response body and headers) that will be returned to the client. This may be the final HTML document, JSON, or XML/RSS feed. It may call a controller directly, call additional views, or a combination.

> Views should not include business logic, they should only include document template information for the response. Break a large view into smaller content pieces as a view may contain other content pieces that are shared among other views.

Views may also include information beyond the body of the document such as response headers.

### Controllers directory

`controllers/`

Controllers contain the business logic that takes the request, analyzes it's properties such as query string and path parameters, transforms it, makes a request to a model (database or other endpoint), and then further analyzes and transforms data before returning it to the view.

Much like views, controllers should be broken into smaller chunks that can be shared and reused among other controllers.

Controllers should not worry about specific data models or the endpoint they access. This allows them to be modular. If a database is changed out for a Restful API, or a database schema or authentication, changes, that should be captured in the Model.

Controllers should be written using Object Oriented Programming (Classes).

### Models directory

`models/`

The `models` directory contain Data Access Objects (DAO) and fetch methods. "Data Access Objects" understand the connections (with authentication) that need to be made and any data transformations that need to take place before returning data back to the controller.

Models should be developed using OOP (Object Oriented Programming) and well thought out so that they can be easily replaced. If a database connection and schema is swapped out for a Restful API endpoint, the downstream controller should not know the difference.

Models use Data Access Objects to perform the authentication, basic parameters, and connections. Models can then transform the data returned into a usable format (parse XML, change an array to an keyed object, etc) for the controller. (Similar to views, but for data).

### Config directory

`config/`

All (non secret) configuration files and methods safe for repositories and used across your application's deployments can be stored in the `config` directory. The Config object defined in this file is static and exists across invocations of the same instance. It should be initialized during a cold start.

### Utils directory

`utils/`

Shared methods that serve as tools, helpers, and utilities can be stored in the `utils` directory. These methods should be independent of Configurations, controllers, views, and models here. As your organization develops methods that are constantly re-used, they should probably be deployed as a Lambda Layer.

### Test directory

`test/`

The `test` directory can be used to store your tests written using Chai or other testing framework.

### Package JSON file

`package.json`

The `package.json` file contains information about the Node application including version number, dependencies, and script information such as for testing.

To install packages that your application uses on your local machine run `npm install` from within the `app` directory. To install or update specific packages for your application run `npm i package-name` (add the `--save-dev` flag if the package is only used locally for testing).

You are encouraged to update your version information using the `npm version` command before merging into the production pipeline.

- `npm version patch`
- `npm version minor`
- `npm version major`
