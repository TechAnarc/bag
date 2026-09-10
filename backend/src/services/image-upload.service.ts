import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import sharp from "sharp";
import { env } from "../config/env";
import { SupabaseStorageService } from "./supabase-storage.service";
import { logger } from "../config/logger";

/**
 * IMAGE UPLOAD SERVICE
 * Handles product image uploads with true WebP conversion using Sharp
 */

export class ImageUploadService {
	private static backendUploadDir = path.join(
		process.cwd(),
		"public",
		"uploads",
		"products",
	);
	private static frontendAssetsDir = path.join(
		process.cwd(),
		"..",
		"frontend",
		"public",
		"assets",
		"products",
	);

	/**
	 * Check if Supabase Storage is configured
	 */
	private static isCloudStorage(): boolean {
		return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
	}

	/**
	 * Initialize upload directories (for local fallback)
	 */
	static initUploadDir(): void {
		if (!fs.existsSync(this.backendUploadDir)) {
			fs.mkdirSync(this.backendUploadDir, { recursive: true });
		}
		if (!fs.existsSync(this.frontendAssetsDir)) {
			fs.mkdirSync(this.frontendAssetsDir, { recursive: true });
		}
	}

	/**
	 * Configure multer storage
	 * Uses memory storage for Sharp processing
	 */
	static getStorage() {
		return multer.memoryStorage();
	}

	/**
	 * File filter for image validation
	 */
	static fileFilter(
		req: Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback,
	) {
		// Be more liberal as Sharp will handle the actual decoding
		const allowedExtensions = /\.(jpg|jpeg|png|webp|heic|heif|avif|tiff|bmp)$/i;
		if (
			file.mimetype.startsWith("image/") ||
			file.originalname.match(allowedExtensions)
		) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Please upload an image."));
		}
	}

	/**
	 * Create multer upload middleware
	 */
	static createUploadMiddleware() {
		return multer({
			storage: this.getStorage(),
			fileFilter: this.fileFilter,
			limits: {
				fileSize: 15 * 1024 * 1024, // 15MB max (high res)
				files: 4,
			},
		}).array("images", 4);
	}

	/**
	 * TRUE CONVERSION: Convert buffer to JPEG using Sharp
	 */
	private static async convertToJpeg(buffer: Buffer): Promise<Buffer> {
		try {
			console.log("[IMG_PROC] ⚙️ Converting to JPEG...");
			return await sharp(buffer)
				.rotate() // Auto-rotate based on EXIF
				.jpeg({
					quality: 85,
					mozjpeg: true,
				})
				.toBuffer();
		} catch (error: any) {
			logger.error(`[IMG_PROC] ❌ Sharp Conversion Failure: ${error.message}`);
			throw new Error(`Image conversion failed: ${error.message}`);
		}
	}

	/**
	 * Upload images and return public URLs
	 */
	static async uploadProductImages(
		req: Request,
		files: Express.Multer.File[],
	): Promise<string[]> {
		const isCloud = this.isCloudStorage();
		const sku = req.body.sku;
		const slotIndex = req.body.index; // Optional specific slot index (1-4)

		if (!sku) throw new Error("SKU is required for image processing");

		const urls: string[] = [];

		if (isCloud) {
			await SupabaseStorageService.initBucket();
		}

		let localIdx = 1;
		for (const file of files) {
			// Determine final filename index
			const finalIdx = slotIndex ? parseInt(slotIndex) : localIdx;
			const filename = `${sku}_${finalIdx}.jpeg`;

			// 1. PERFORM ACTUAL PIXEL CONVERSION
			const jpegBuffer = await this.convertToJpeg(file.buffer);

			if (isCloud) {
				// Upload to Supabase Storage as image/jpeg
				const jpegFile = {
					...file,
					buffer: jpegBuffer,
					mimetype: "image/jpeg",
				};
				console.log(
					`[IMG_UPLOAD] ☁️ Uploading ${filename} (JPEG) to Supabase Storage...`,
				);
				const url = await SupabaseStorageService.uploadFile(
					jpegFile as any,
					`products/${filename}`,
				);
				urls.push(url);
			} else {
				// Local path
				this.initUploadDir();
				const backendPath = path.join(this.backendUploadDir, filename);
				const frontendPath = path.join(this.frontendAssetsDir, filename);
				// Save to backend public
				fs.writeFileSync(backendPath, jpegBuffer);

				// Save to frontend assets
				fs.writeFileSync(frontendPath, jpegBuffer);

				console.log(`[IMG_UPLOAD] ✅ Saved local JPEG: ${filename}`);
				urls.push(`/assets/products/${filename}`);
			}
			localIdx++;
		}

		return urls;
	}

	/**
	 * Copy uploaded files (Legacy - no longer used by new pipeline)
	 */
	static async copyToFrontendAssets(
		files: Express.Multer.File[],
	): Promise<void> {
		// No-op for new Sharp-based pipeline
	}

	/**
	 * Get public URLs for local uploaded images
	 */
	static getImageUrls(files: Express.Multer.File[]): string[] {
		// This is now handled within uploadProductImages
		return [];
	}

	/**
	 * Delete images for a product
	 */
	static async deleteProductImages(
		sku: string,
		existingUrls: string[] = [],
	): Promise<void> {
		const isCloud = this.isCloudStorage();

		if (isCloud) {
			console.log(`[IMG_UPLOAD] ☁️ Deleting cloud images for SKU: ${sku}`);
			await SupabaseStorageService.deleteProductImages(sku);
		} else {
			console.log(`[IMG_UPLOAD] 🗑️ Deleting local images for SKU: ${sku}`);

			// Specifically target .jpeg as that's all we store now
			const imagePattern = new RegExp(`^${sku}_\\d+\\.jpeg$`, "i");

			const dirs = [this.backendUploadDir, this.frontendAssetsDir];
			dirs.forEach((dir) => {
				if (fs.existsSync(dir)) {
					const files = fs.readdirSync(dir);
					files.forEach((file) => {
						if (imagePattern.test(file)) {
							try {
								fs.unlinkSync(path.join(dir, file));
							} catch (e) {}
						}
					});
				}
			});
		}
	}
}
