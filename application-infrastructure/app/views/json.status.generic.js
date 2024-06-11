exports.status200 = {
	statusCode: 200,
	headers: {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json"
	},
	body: JSON.stringify({
		message: "Success"
	})
};

exports.status404 = {
	statusCode: 404,
	headers: {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json"
	},
	body: JSON.stringify({
		message: "Not Found"
	})
};

exports.status500 = {
	statusCode: 500,
	headers: {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/json"
	},
	body: JSON.stringify({
		message: "Internal Server Error"
	})
};