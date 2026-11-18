const axios = require("axios");
require("dotenv").config();

async function testLogin() {
	const email = process.env.ADMIN_EMAIL;
	const password = process.env.ADMIN_PASSWORD;
	if (!email || !password) {
		console.error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
		process.exit(1);
	}
	const url = "http://localhost:4000/api/v1/admin/auth/login";

	console.log(`Testing login to ${url}...`);
	try {
		const response = await axios.post(
			url,
			{
				email: email,
				password: password,
			},
			{
				headers: { "Content-Type": "application/json" },
				validateStatus: () => true, // Allow all status codes
			},
		);

		console.log("Status Code:", response.status);
		console.log("Response Body:", JSON.stringify(response.data, null, 2));
		console.log("Set-Cookie Headers:", response.headers["set-cookie"]);

		if (response.status === 200 && response.data.success) {
			console.log("✅ Login successful!");
		} else {
			console.log("❌ Login failed.");
		}
	} catch (error) {
		console.error("ERROR:", error.message);
		if (error.response) {
			console.error("Response Data:", error.response.data);
		}
	}
}

testLogin();
