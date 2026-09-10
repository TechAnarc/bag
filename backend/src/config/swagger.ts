import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { logger } from "./logger";

const swaggerDocument = {
	openapi: "3.0.0",
	info: {
		title: "Bombay Bag House API",
		version: "1.0.0",
		description: "API Documentation for Bombay Bag House - Luxury Bag Commerce Platform",
	},
	servers: [
		{
			url: "http://localhost:4000/api/v1",
			description: "Local server",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
	paths: {
		"/auth/register": {
			post: {
				tags: ["Authentication"],
				summary: "Register a new user",
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: { type: "string" },
									email: { type: "string" },
									password: { type: "string" },
								},
								required: ["name", "email", "password"],
							},
						},
					},
				},
				responses: {
					201: { description: "User created" },
					400: { description: "Validation error" },
				},
			},
		},
		"/auth/login": {
			post: {
				tags: ["Authentication"],
				summary: "Login user",
				requestBody: {
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									email: { type: "string" },
									password: { type: "string" },
								},
								required: ["email", "password"],
							},
						},
					},
				},
				responses: {
					200: { description: "Login successful" },
					401: { description: "Invalid credentials" },
				},
			},
		},
		"/products": {
			get: {
				tags: ["Products"],
				summary: "Get all products",
				parameters: [
					{
						name: "category",
						in: "query",
						schema: { type: "string" },
						description: "Filter by category",
					},
				],
				responses: {
					200: { description: "List of products" },
				},
			},
			post: {
				tags: ["Products"],
				summary: "Create a product (Admin only)",
				security: [{ bearerAuth: [] }],
				responses: {
					201: { description: "Product created" },
				},
			},
		},
	},
};

export const setupSwagger = (app: Express) => {
	try {
		app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
		logger.info("📝 Swagger UI: http://localhost:4000/api-docs");
	} catch (error) {
		logger.error("❌ Failed to initialize Swagger Documentation:", error);
	}
};
