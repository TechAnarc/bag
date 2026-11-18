const { Client } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
	console.error("❌ DATABASE_URL environment variable is required");
	process.exit(1);
}

const client = new Client({
	connectionString: process.env.DATABASE_URL,
});

async function test() {
	try {
		await client.connect();
		console.log("✅ Connected successfully");
		const res = await client.query("SELECT NOW()");
		console.log("Time:", res.rows[0]);
		await client.end();
	} catch (err) {
		console.error("❌ Connection failed");
		console.error(err);
	}
}

test();
