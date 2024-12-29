export interface User {
	id: string;
	tokenKey: string;
	email: string;
	emailVisibility: boolean;
	verified: boolean;
	name: string;
	avatar?: string;
	created?: Date | string;
	updated?: Date | string;
}

export interface Item {
	id: string;
	store: string;
	name: string;
	quantity?: number;
	category?: string;
	aisle?: string;
	in_cart: boolean;
	last_purchased?: Date | string;
	frequency?: number;
	icon?: string;
	created: Date | string;
	updated: Date | string;
}

export interface List {
	id: string;
	name: string;
	created: Date | string;
	updated: Date | string;
}

export interface Store {
	id: string;
	list: string;
	name: string;
	color: string;
	created: Date | string;
	updated: Date | string;
}

export interface UserList {
	id: string;
	user: string;
	list: string;
	created: Date | string;
	updated: Date | string;
}
