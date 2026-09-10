const { Client } = require("pg");
const client = new Client({
	connectionString:
		"postgresql://postgres:supabaseisgood@db.obndverrhnewlcapkxam.supabase.co:5432/postgres",
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
