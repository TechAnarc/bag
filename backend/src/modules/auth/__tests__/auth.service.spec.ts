import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../auth.service";
import { AuthRepository } from "../auth.repository";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

vi.mock("../auth.repository");

describe("AuthService", () => {
	let authService: AuthService;
	let authRepository: any;

	beforeEach(() => {
		vi.clearAllMocks();
		authService = new AuthService();
		authRepository = (authService as any).repository;
	});

	describe("register", () => {
		it("should throw an error if user already exists", async () => {
			authRepository.findByEmail.mockResolvedValue({ id: "1" });

			await expect(
				authService.register({
					email: "test@example.com",
					password: "password123",
					name: "Test User",
				}),
			).rejects.toThrow("User already exists");
		});

		it("should hash password and create user", async () => {
			authRepository.findByEmail.mockResolvedValue(null);
			authRepository.createUser.mockResolvedValue({
				id: "1",
				email: "test@example.com",
				role: "USER",
			});

			const result = await authService.register({
				email: "test@example.com",
				password: "password123",
				name: "Test User",
			});

			expect(authRepository.createUser).toHaveBeenCalled();
			expect(result).toHaveProperty("accessToken");
			expect(result).toHaveProperty("refreshToken");
		});
	});

	describe("login", () => {
		it("should throw if user not found", async () => {
			authRepository.findByEmail.mockResolvedValue(null);

			await expect(
				authService.login("test@example.com", "password123"),
			).rejects.toThrow("Invalid credentials");
		});

		it("should throw if password does not match", async () => {
			authRepository.findByEmail.mockResolvedValue({
				id: "1",
				passwordHash: "hashed_pass",
			});
			vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

			await expect(
				authService.login("test@example.com", "password123"),
			).rejects.toThrow("Invalid credentials");
		});
	});
});
