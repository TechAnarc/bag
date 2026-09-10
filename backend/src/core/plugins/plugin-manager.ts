import { Express } from "express";
import { logger } from "../../config/logger";
import { eventBus } from "../events/event-bus";

export interface IPlugin {
	name: string;
	version: string;
	initialize(app: Express): Promise<void> | void;
}

export class PluginManager {
	private plugins: Map<string, IPlugin> = new Map();

	public async register(plugin: IPlugin, app: Express) {
		if (this.plugins.has(plugin.name)) {
			logger.warn(`[PluginManager] Plugin ${plugin.name} already registered.`);
			return;
		}

		logger.info(
			`[PluginManager] Loading plugin: ${plugin.name} v${plugin.version}`,
		);
		await plugin.initialize(app);
		this.plugins.set(plugin.name, plugin);
	}

	public getPlugin(name: string): IPlugin | undefined {
		return this.plugins.get(name);
	}
}

export const pluginManager = new PluginManager();
