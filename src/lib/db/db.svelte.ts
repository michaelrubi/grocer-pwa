// src/lib/db/pokerune.svelte.ts
import PocketBase, { type AuthRecord, type BaseModel } from 'pocketbase';
import Dexie, { type EntityTable } from 'dexie';
import { convertSchema, type PbCollection } from '$lib/pokedex';
import pbSchema from './pbSchema.json';
import type { User, Item, List, Store, UserList } from '$lib/types';
import { customAlphabet } from 'nanoid';
interface CollectionType {
	[key: string]: any[];
	items: Item[];
	lists: List[];
	stores: Store[];
	user_lists: UserList[];
}

type SyncOperation = 'Create' | 'Update' | 'Delete';
type SyncDestination = 'client' | 'server';

function createPokeRune(
	pbSchema: PbCollection[],
	url = 'https://grocer.pockethost.io',
	dbName = 'grocer'
) {
	const pb = new PocketBase(url);
	let userAuth = $state<AuthRecord | null>(pb.authStore.record);

	pb.authStore.onChange(() => {
		userAuth = pb.authStore.record;
		if (userAuth && !user) {
			user = getUser() as unknown as User;
		}
	});

	const db = new Dexie(dbName) as Dexie & {
		users: EntityTable<User, 'id'>;
		items: EntityTable<Item, 'id'>;
		lists: EntityTable<List, 'id'>;
		stores: EntityTable<Store, 'id'>;
		user_lists: EntityTable<UserList, 'id'>;
	};

	const dbSchema = convertSchema(pbSchema);

	let user = $state<User | null | undefined>(null);
	let collections: CollectionType = $state({
		items: [],
		lists: [],
		stores: [],
		user_lists: []
	});

	db.version(1).stores(dbSchema);

	async function init() {
		try {
			if (userAuth) {
				console.log('syncing data');
				await syncData();
			}
		} catch (err) {
			console.error('Failed to initialize database:', err);
		}
	}

	async function syncData() {
		try {
			const id: string | undefined = userAuth?.id;
			if (!id) {
				console.error('No current user ID found');
				return;
			}

			// Fetch user data from server and client
			const userPB = await pb.collection('users').getOne(id);
			const userDB = await db.table('users').get(id);
			const userToSync = await checkSync(userDB, userPB);

			if (userToSync) {
				await db.table('users').put(userToSync);
				db.users.update = userToSync;
			}

			const emptyClientDB = (await db.table('categories').count()) == 0;

			await Promise.all(
				['items', 'lists', 'stores', 'user_lists'].map(
					emptyClientDB ? serverCollectionToClient : collectionConflict
				)
			);

			syncRunes();
		} catch (error) {
			console.error('Failed to sync with server:', error);
		}
	}

	function checkSync(clientData: any, serverData: any) {
		if (!clientData && serverData) {
			return serverData;
		} else if (clientData && !serverData) {
			return clientData;
		} else if (clientData && serverData) {
			if (JSON.stringify(clientData) == JSON.stringify(serverData)) {
				console.log('Data already synced');
				return null;
			}
			const clientUpdated = clientData.updated ? new Date(clientData.updated).getTime() : 0;
			const serverUpdated = serverData.updated ? new Date(serverData.updated).getTime() : 0;
			if (serverUpdated > clientUpdated) {
				return serverData;
			} else {
				return clientData;
			}
		} else {
			console.error('No data found');
			return null;
		}
	}

	async function collectionConflict(collectionName: string) {
		const serverData = await pb.collection(collectionName).getFullList();
		const clientData = await db.table(collectionName).toArray();

		// New Method
		const serverRecordMap = new Map(serverData.map((r) => [r.id, r]));
		const clientRecordMap = new Map(clientData.map((r) => [r.id, r]));

		const createClient: any[] = [];
		const updateClient: any[] = [];
		const createServer: any[] = [];
		const updateServer: any[] = [];

		const checked = [];

		for (const serverRecord of serverData) {
			const clientRecord = clientRecordMap.get(serverRecord.id);

			if (!clientRecord) {
				createServer.push(serverRecord);
			} else {
				const dataToSync = checkSync(clientRecord, serverRecord);
				if (dataToSync && !isDeleted(dataToSync)) {
					if (dataToSync === serverRecord) {
						updateClient.push(dataToSync);
					} else {
						checked.push(dataToSync);
					}
				}
			}
		}

		for (const clientRecord of clientData) {
			if (!serverRecordMap.has(clientRecord.id)) {
				createClient.push(clientRecord);
			}
		}

		await Promise.all([
			batchSync(collectionName, createClient, 'Create', 'client'),
			batchSync(collectionName, updateClient, 'Update', 'client'),
			batchSync(collectionName, createServer, 'Create', 'server'),
			batchSync(collectionName, updateServer, 'Update', 'server')
		]);

		/*
		// Old Method
		for (const serverRecord of serverData) {
			const clientRecord = clientData.find((r) => r.id === serverRecord.id);
			const dataToSync = checkSync(clientRecord, serverRecord);
			if (dataToSync) {
				if (!isDeleted(dataToSync)) await write(collectionName, dataToSync);
				checked.push(dataToSync);
			}
		}

		for (const clientRecord of clientData) {
			if (!checked.find((r) => r.id === clientRecord?.id)) {
				const dataToSync = checkSync(clientRecord, null);
				if (dataToSync) {
					if (!isDeleted(dataToSync)) await write(collectionName, dataToSync);
					checked.push(dataToSync);
				}
			}
		}
		*/
	}

	async function batchSync(
		collectionName: string,
		data: any[],
		operation: SyncOperation,
		destination: SyncDestination
	) {
		try {
			switch (destination) {
				case 'client':
					if (operation == 'Create') {
						await db.table(collectionName).bulkAdd(data);
					} else if (operation == 'Update') {
						await db.table(collectionName).bulkPut(data);
					}
					break;
				case 'server':
					const batchService = pb.createBatch();
					for (const record of data) {
						if (operation == 'Create') {
							batchService.collection(collectionName).create(record);
						} else if (operation == 'Update') {
							batchService.collection(collectionName).update(record.id, record);
						}
					}
			}
			console.log(`${operation}d ${data.length} records in ${collectionName} on ${destination}.`);
		} catch (error) {
			console.error('Failed to sync with server:', error);
		}
	}

	async function isDeleted(data: any) {
		if (data) return false;
	}

	async function serverCollectionToClient(collectionName: string) {
		try {
			const collectionData = await pb.collection(collectionName).getFullList();
			await db.table(collectionName).bulkPut(collectionData);
		} catch (error) {
			console.error(`Failed to update ${collectionName}:`, error);
		}
	}

	async function syncRunes() {
		for (const collectionName of Object.keys(collections)) {
			collections[collectionName as keyof typeof collections] = await loadRune(collectionName);
		}
	}

	async function loadRune(collection: string): Promise<BaseModel[]> {
		const data = await db.table(collection).toArray();
		return data.sort((a, b) => {
			if (a.name && b.name) {
				return (a.name as string).localeCompare(b.name as string);
			}
			if (a.index !== undefined && b.index !== undefined) {
				return (a.index as number) - (b.index as number);
			}
			return 0;
		});
	}

	async function fetchUserData(): Promise<User | null> {
		const id: string | undefined = userAuth?.id;
		if (!id) {
			console.error('No current user ID found in server.userAuth');
			return null;
		}
		const userData = await db.users.get(id);
		if (!userData) {
			console.error(`No user data found for ID: ${id}`);
			return null;
		}
		console.log('Fetched user data:', userData);
		return userData as User;
	}

	function fixDate(date: string) {
		return date.replace('T', ' ');
	}

	async function write(collectionName: string, data: any): Promise<void> {
		const clonedData = JSON.parse(JSON.stringify(data));
		console.log(`Writing to ${collectionName}: ${JSON.stringify(data)}`);

		if (!clonedData.id) {
			clonedData.id = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 15)();
		}

		try {
			await writeToClient(collectionName, clonedData);
			await writeToServer(collectionName, clonedData);
			await writeToRune(collectionName, clonedData);
		} catch (error) {
			console.error(`Failed to write to ${collectionName}:`, error);
		}
	}

	async function writeToClient(collectionName: string, data: any): Promise<void> {
		const clientData = await db.table(collectionName).get(data.id);

		if (!clientData) {
			try {
				await db.table(collectionName).add(data);
			} catch (err) {
				console.error(`Error creating record in ${collectionName} (No Local Data):`, err);
			}
		} else {
			try {
				await db.table(collectionName).update(data.id, data);
			} catch (err) {
				console.error(`Error updating record in ${collectionName}:`, err);
			}
		}
	}

	async function writeToServer(collectionName: string, data: any): Promise<void> {
		try {
			const serverData = await pb.collection(collectionName).getOne(data.id);

			if (serverData) {
				try {
					await pb.collection(collectionName).update(data.id, data);
				} catch (err) {
					console.error(`Error updating record in ${collectionName}:`, err);
				}
			}
		} catch (err: any) {
			if (err.status === 404) {
				try {
					await pb.collection(collectionName).create(data);
				} catch (err) {
					console.error(`Error creating record in ${collectionName} (No Server Data):`, err);
				}
			} else {
				console.error(`Error fetching record in ${collectionName}:`, err);
				throw err; // Re-throw to be caught by the outer try...catch
			}
		}
	}

	function writeToRune(collectionName: string, data: any): void {
		const index = collections[collectionName as keyof typeof collections].findIndex(
			(item) => item.id === data.id
		);
		if (index !== -1) {
			collections[collectionName as keyof typeof collections][index] = data;
		} else {
			collections[collectionName as keyof typeof collections].push(data);
		}
	}

	/*
	async function remove(collectionName: string, id: string): Promise<void> {
		console.log(`Deleting ${id} from ${collectionName}`);
		let dataToDelete: any;
		try {
			dataToDelete = await db.table(collectionName).get(id);
		} catch (err) {
			console.error(`Error fetching record in ${collectionName}:`, err);
		}

		if (!dataToDelete) {
			console.warn(`No data found to delete in ${collectionName} with ID: ${id}`);
		} else {
			const ArchivedRecord: ArchivedRecord = {
				id: id,
				synced: false,
				data: JSON.parse(JSON.stringify(dataToDelete)),
				user: dataToDelete.user,
				created: fixDate(new Date().toISOString()),
				updated: fixDate(new Date().toISOString())
			};
			try {
				await write('deleted', ArchivedRecord);
			} catch (err) {
				console.error(`Error archiving record in ${collectionName}:`, err);
			}

			try {
				await db.table(collectionName).delete(id);
				collections[collectionName as keyof typeof collections] = collections[
					collectionName as keyof typeof collections
				].filter((item) => item.id !== id);
			} catch (err) {
				console.error(`Error deleting record in ${collectionName}:`, err);
			}
			try {
				await pb.collection(collectionName).delete(id);
			} catch (err) {
				console.error(`Error deleting record in ${collectionName}:`, err);
			} finally {
				console.log(`Deleted record in ${collectionName}:`, id);
			}
		}
	}
    */

	async function getUser(): Promise<User | null> {
		if (user) {
			return user as User;
		}
		const id = userAuth?.id;
		if (!id) {
			console.error('No current user ID found in server.userAuth');
			return null;
		}
		user = await fetchUserData();
		return user as User;
	}

	return {
		pb,
		get userAuth() {
			return userAuth;
		},
		get stores() {
			return collections.stores;
		}
	};
}

export const pokerune = createPokeRune(pbSchema as PbCollection[]);
