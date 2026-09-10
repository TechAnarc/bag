import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * SUPABASE STORAGE SERVICE
 * Handles file uploads to Supabase Storage bucket
 */
export class SupabaseStorageService {
	private static _client: any = null;
	private static readonly BUCKET_NAME = "product-images";

	private static get client() {
		if (!this._client) {
			const url = env.SUPABASE_URL;
			const key = env.SUPABASE_SERVICE_ROLE_KEY;

			if (!url || !key) {
				logger.error(
					"[SUPABASE_STORAGE] ❌ Configuration missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
				);
				throw new Error("Supabase configuration missing");
			}

			this._client = createClient(url, key);
		}
		return this._client;
	}

	/**
	 * Initialize storage bucket (create if doesn't exist)
	 */
	static async initBucket(): Promise<void> {
		try {
			const { data: buckets } = await this.client.storage.listBuckets();
			const exists = buckets?.some((b) => b.name === this.BUCKET_NAME);

			if (!exists) {
				const { data, error } = await this.client.storage.createBucket(
					this.BUCKET_NAME,
					{
						public: true,
						fileSizeLimit: 10485760, // 10MB
					},
				);

				if (error) {
					console.error(
						"[SUPABASE_STORAGE] ❌ Bucket creation failed:",
						error.message,
					);
				} else {
					console.log(
						"[SUPABASE_STORAGE] ✅ Bucket created:",
						this.BUCKET_NAME,
					);
				}
			}
		} catch (error: any) {
			console.error("[SUPABASE_STORAGE] ❌ Init error:", error.message);
		}
	}

	/**
	 * Upload a file to Supabase Storage
	 */
	static async uploadFile(
		file: Express.Multer.File,
		path: string,
	): Promise<string> {
		const { data, error } = await this.client.storage
			.from(this.BUCKET_NAME)
			.upload(path, file.buffer, {
				contentType: file.mimetype,
				upsert: true,
			});

		if (error) {
			console.error("[SUPABASE_STORAGE] ❌ Upload failed:", error.message);
			throw new Error(`Upload failed: ${error.message}`);
		}

		// Get public URL
		const {
			data: { publicUrl },
		} = this.client.storage.from(this.BUCKET_NAME).getPublicUrl(path);

		console.log(`[SUPABASE_STORAGE] ✅ Uploaded: ${path}`);
		return publicUrl;
	}

	/**
	 * Delete a file from Supabase Storage
	 */
	static async deleteFile(path: string): Promise<void> {
		const { error } = await this.client.storage
			.from(this.BUCKET_NAME)
			.remove([path]);

		if (error) {
			console.error("[SUPABASE_STORAGE] ❌ Delete failed:", error.message);
			throw new Error(`Delete failed: ${error.message}`);
		}

		console.log(`[SUPABASE_STORAGE] 🗑️ Deleted: ${path}`);
	}

	/**
	 * Delete multiple files by SKU pattern
	 */
	static async deleteProductImages(sku: string): Promise<void> {
		try {
			// List all files in the bucket
			const { data: files, error: listError } = await this.client.storage
				.from(this.BUCKET_NAME)
				.list("products", {
					search: sku,
				});

			if (listError || !files) {
				console.error("[SUPABASE_STORAGE] ❌ List failed:", listError?.message);
				return;
			}

			// Filter files matching the SKU pattern
			const filesToDelete = files
				.filter((f) => f.name.startsWith(sku))
				.map((f) => `products/${f.name}`);

			if (filesToDelete.length > 0) {
				const { error: deleteError } = await this.client.storage
					.from(this.BUCKET_NAME)
					.remove(filesToDelete);

				if (deleteError) {
					console.error(
						"[SUPABASE_STORAGE] ❌ Bulk delete failed:",
						deleteError.message,
					);
				} else {
					console.log(
						`[SUPABASE_STORAGE] 🗑️ Deleted ${filesToDelete.length} images for SKU: ${sku}`,
					);
				}
			}
		} catch (error: any) {
			console.error("[SUPABASE_STORAGE] ❌ Delete error:", error.message);
		}
	}
}
