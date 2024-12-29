import PocketBase, { RecordService, type RecordModel } from 'pocketbase';
import Dexie, { type Table } from 'dexie';
import { customAlphabet } from 'nanoid';
import { convertSchema, type PbCollection } from './index';

export default class PokeDex<
	T extends { id: string; created?: string; updated?: string }
> extends Dexie {
	public pb: PocketBase;
	private collectionTables: { [name: string]: Table } = {};
	private dexieSchema: { [key: string]: string } = {};

	constructor(dbName: string, pbSchema: PbCollection[], url: string = 'http://127.0.0.1:8090') {
		super(dbName);
		this.pb = new PocketBase(url);
		this.dexieSchema = convertSchema(pbSchema);
		this.version(1).stores(this.dexieSchema);
		this.init().catch(console.error);
	}

	async init() {
		await this.open().catch((err) => {
			console.error('Failed to open database:', err);
		});
	}

	async getTable<T extends { id: string; created?: string; updated?: string }>(
		collectionName: string
	): Promise<Table<T, string>> {
		if (this.collectionTables[collectionName]) {
			return this.collectionTables[collectionName] as Table<T, string>;
		}

		const tableExists = this.tables.some((table) => table.name === collectionName);
		if (!tableExists) {
			const nextVersion = this.verno + 1;
			this.close();
			this.version(nextVersion).stores(this.dexieSchema);
			await this.open();
		}

		const table = this.table(collectionName) as Table<T, string, T>;
		this.collectionTables[collectionName] = table;
		return table as Table<T, string>;
	}

	async sync() {
		const collectionNames = await this.getCollectionNames();
		for (const collectionName of collectionNames) {
			await this.syncCollection(collectionName);
		}
	}

	async syncCollection(collectionName: string) {
		const table = await this.getTable<T>(collectionName);
		const pbCollection = this.pb.collection(collectionName);

		try {
			const localData = (await table!.count()) > 0;
			if (!localData) {
				await this.syncFromServer(table!, pbCollection);
			} else {
				await this.syncToServer(table!, pbCollection);
			}
		} catch (err) {
			console.error(`Failed to sync ${collectionName}:`, err);
		}
	}

	async syncFromServer(dexTable: Table<T, string>, pbCollection: RecordService<RecordModel>) {
		let hasMore = true;
		let page = 1;
		const pageSize = 50;

		while (hasMore) {
			const records = await pbCollection.getList(page, pageSize);
			hasMore = records.items.length === pageSize;

			const items = records.items.map((item) => {
				if (item.created) item.created = this.fixDate(item.created);
				if (item.updated) item.updated = this.fixDate(item.updated);
				return item as unknown as T;
			});
			// const items = records.items as unknown as T[];
			await dexTable.bulkPut(
				items,
				records.items.map((item) => item.id)
			);

			page++;
		}
	}

	async syncToServer(dexTable: Table<T, string>, pbCollection: RecordService<RecordModel>) {
		try {
			const localKeys = (await dexTable.toCollection().primaryKeys()) as string[];
			if (localKeys.length === 0) return;

			const batch = this.pb.createBatch();

			for (const key of localKeys) {
				const localRecord = await dexTable.get(key);
				if (!localRecord) continue;

				if (localRecord.created) localRecord.created = this.fixDate(localRecord.created);
				if (localRecord.updated) localRecord.updated = this.fixDate(localRecord.updated);

				try {
					await pbCollection.getOne(key);
					batch.collection(dexTable.name).update(key, localRecord);
				} catch (err: any) {
					if (err.status == 404) {
						batch.collection(dexTable.name).create(localRecord);
					} else {
						console.error(`Error checking/updating record ${key}:`, err);
					}
				}
			}

			if (batch.collection.length > 0) {
				const results = await batch.send();
				console.log('Batch sync results:', results);
			}
		} catch (err) {
			console.error(`Failed to sync ${dexTable.name} to server:`, err);
		}
	}

	private async getCollectionNames(): Promise<string[]> {
		try {
			const localNames = this.tables.map((table) => table.name);
			const serverResult = await this.pb.collections.getList(1, 50);
			const serverNames = serverResult.items.map((collection) => collection.name);

			const allNames = Array.from(new Set([...localNames, ...serverNames]));
			return allNames;
		} catch (err) {
			console.error('Failed to get collection names:', err);
			return [];
		}
	}

	fixDate(dateString: string | undefined): string {
		if (!dateString) return '';
		return dateString.replace('T', ' ').replace(/\.\d{3}Z/, '');
	}

	generateId(): string {
		const id = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 15)(15);
		return id;
	}
}
