// src/lib/pokedex/schema.ts
import type { PbCollection, PbField } from './types';

function pbFieldToDexieIndex(field: PbField): string {
	let index = '';

	if (field.unique) {
		index += '&';
	}

	// Remove COLLATE NOCASE
	index += field.name.replace(/ COLLATE NOCASE/i, '');

	return index;
}

export function convertSchema(pbSchema: PbCollection[]): { [key: string]: string } {
	const dexieSchema: { [key: string]: string } = {};

	for (const collection of pbSchema) {
		// Skip system collections
		if (collection.name.startsWith('_')) {
			continue;
		}

		const indexes: string[] = [];

		for (const field of collection.fields) {
			// Skip system fields and 'id'
			if ((field.system && field.name !== 'id') || indexes.includes(field.name)) {
				// console.log('Skipping field: ', field.name);
				continue;
			}
			const index = pbFieldToDexieIndex(field);

			if (index) {
				indexes.push(index);
			}
		}

		// Handle custom indexes
		if (collection.indexes) {
			const processedIndexes = processCollectionIndexes(collection.indexes);
			indexes.push(...processedIndexes);
		}

		dexieSchema[collection.name] = indexes.join(',');
	}

	return dexieSchema;
}

function processCollectionIndexes(indexes: string[]) {
	const processedIndexes: string[] = [];
	for (const index of indexes) {
		const matches = index.match(/\(([^)]+)\)/);
		if (matches && matches[1]) {
			const fields = matches[1].split(',').map((field) =>
				field
					.trim()
					.replace(/`/g, '')
					.replace(/ COLLATE NOCASE/i, '')
			);
			// Exclude 'id'
			// if (!fields.includes('id')) {
			// 	processedIndexes.push(fields.join(','));
			// }
		}
	}
	return processedIndexes;
}
