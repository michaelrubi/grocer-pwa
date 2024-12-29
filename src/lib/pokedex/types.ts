export interface PbField {
	id?: string;
	primaryKey?: boolean;
	name: string;
	type: string;
	required: boolean;
	system?: boolean;
	unique?: boolean;
	options?: any;
	hidden?: boolean; //might not be right
	max?: number;
	min?: number;
	pattern?: string;
	presentable?: boolean;
	cost?: number;
	exceptDomains?: any;
	onlyDomains?: any;
	onCreate?: boolean;
	onUpdate?: boolean;
	autogeneratePattern?: string;
	cascadeDelete?: boolean;
	collectionId?: string;
	maxSelect?: number;
	minSelect?: number;
	maxSize?: number;
	onlyInt?: boolean;
	convertURLs?: boolean;
	mimeTypes?: string[];
	thumbs?: string[];
}

// Type for a PocketBase collection definition in the schema
export interface PbCollection {
	id: string;
	name: string;
	type: string;
	fields: PbField[];
	indexes?: string[];
	listRule: string | null;
	viewRule: string | null;
	createRule: string | null;
	updateRule: string | null;
	deleteRule: string | null;
	system: boolean;
	authRule?: string | null;
	manageRule?: string | null;
	authAlert?: {
		enabled?: boolean;
		emailTemplate?: {
			subject?: string;
			body?: string;
		};
	};
	oauth2?: {
		mappedFields?: {
			id?: string;
			name?: string;
			username?: string;
			avatarURL?: string;
		};
		enabled?: boolean;
	};
	passwordAuth?: {
		enabled?: boolean;
		identityFields?: string[];
	};
	mfa?: {
		enabled?: boolean;
		duration?: number;
		rule?: string;
	};
	otp?: {
		enabled?: boolean;
		duration?: number;
		length?: number;
		emailTemplate?: {
			subject?: string;
			body?: string;
		};
	};
	authToken?: {
		duration?: number;
	};
	passwordResetToken?: {
		duration?: number;
	};
	emailChangeToken?: {
		duration?: number;
	};
	verificationToken?: {
		duration?: number;
	};
	fileToken?: {
		duration?: number;
	};
	verificationTemplate?: {
		subject?: string;
		body?: string;
	};
	resetPasswordTemplate?: {
		subject?: string;
		body?: string;
	};
	confirmEmailChangeTemplate?: {
		subject?: string;
		body?: string;
	};
}
