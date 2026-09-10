import { Admin, User } from "@prisma/client";

declare global {
	namespace Express {
		interface Request {
			id?: string;
			user?: User;
			admin?: Admin;
			auth?: {
				id: string;
				email: string;
				role: string;
				type: "USER" | "ADMIN";
			};
			tenantId?: string;
		}
	}
}
