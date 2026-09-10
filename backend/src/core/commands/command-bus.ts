import { logger } from "../../config/logger";
import { v4 as uuidv4 } from "uuid";

export interface ICommand {
	type: string;
	payload: any;
	metadata: {
		commandId: string;
		tenantId: string;
		timestamp: Date;
		actor: string;
	};
}

export type CommandHandler = (command: ICommand) => Promise<any>;

class CommandBus {
	private handlers: Map<string, CommandHandler> = new Map();

	public register(commandType: string, handler: CommandHandler) {
		this.handlers.set(commandType, handler);
		logger.debug(`[CommandBus] Registered handler for: ${commandType}`);
	}

	public async execute(
		type: string,
		payload: any,
		metadata: { tenantId: string; actor: string },
	): Promise<any> {
		const handler = this.handlers.get(type);
		if (!handler) {
			throw new Error(
				`[CommandBus] No handler registered for command: ${type}`,
			);
		}

		const command: ICommand = {
			type,
			payload,
			metadata: {
				commandId: uuidv4(),
				tenantId: metadata.tenantId,
				timestamp: new Date(),
				actor: metadata.actor,
			},
		};

		logger.info(`[CommandBus] Executing ${type}`, {
			commandId: command.metadata.commandId,
			actor: command.metadata.actor,
		});

		try {
			return await handler(command);
		} catch (error: any) {
			logger.error(`[CommandBus] Command ${type} failed: ${error.message}`);
			throw error;
		}
	}
}

export const commandBus = new CommandBus();
