# PokeDex: Offline-First Data Synchronization with PocketBase and Dexie.js

[![npm version](https://badge.fury.io/js/pocket-index.svg)](https://badge.fury.io/js/pocket-index)

PokeDex is a TypeScript library that simplifies building offline-first web applications using PocketBase as a backend and Dexie.js for local IndexedDB storage. It handles seamless synchronization between the local database and your PocketBase server, ensuring data consistency and a smooth user experience even with intermittent network connectivity.

## Features

*   **Automatic Schema Conversion:** Generates a Dexie.js schema directly from your PocketBase `pbschema.json`, eliminating manual schema definition.
*   **Offline-First Data Storage:** Uses IndexedDB via Dexie.js for local data persistence, allowing your app to function seamlessly offline.
*   **Bi-Directional Synchronization:** Keeps your local data and PocketBase server in sync, automatically handling data conflicts.
*   **TypeScript Support:** Built with TypeScript for enhanced type safety and developer experience.
*   **Generic Types:** Uses generics to provide type-safe interactions with your data collections.
*   **Efficient Data Handling:** Employs Dexie.js's `bulkPut` for optimized data insertion and PocketBase's batch operations for efficient updates and creations on the server.

## Installation

```bash
npm install pocket-index pocketbase dexie
# or
yarn add pocket-index pocketbase dexie
```

## Prerequisites

*   **PocketBase:** You need a running PocketBase instance.
*   **Dexie.js:** Dexie.js is a lightweight IndexedDB wrapper.
*   **pbschema.json:** Export your PocketBase schema as a `pbschema.json` file. You can do this from the PocketBase admin UI.
*   **TypeScript:** PokeDex is written in TypeScript, so you'll need a TypeScript project setup.

## Usage

1.  **Import and Initialize:**

```typescript
import PocketBase from 'pocketbase';
import Dexie from 'dexie';
import PokeDex, { PbCollection } from 'pokedex'; 
import pbschema from './pbschema.json'; // Import your pbschema.json

// Define interfaces for your PocketBase collections (optional but recommended)
interface User {
  id: string;
  name: string;
  email: string;
  created?: string;
  updated?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  created?: string;
  updated?: string;
}

async function main() {
  // Initialize PokeDex with your database name, pbschema, and PocketBase URL
  const pokeDex = new PokeDex<{ id: string; created?: string; updated?: string }>(
    'my-pokedex-db',
    pbschema as PbCollection[],
    'http://127.0.0.1:8090'
  );

  // Initialize the database (opens the connection)
  await pokeDex.init();

  // ... rest of your application logic ...
}

main();
```

1.  **Accessing Collections:**

```typescript
// Get a type-safe reference to a collection table (e.g., 'users')
const usersTable = await pokeDex.getTable<User>('users');

// Perform CRUD operations using Dexie.js API
await usersTable.put({ id: 'user1', name: 'John Doe', email: 'john.doe@example.com' });

const user = await usersTable.get('user1');
if (user) {
  console.log(user.name);
}

await usersTable.update('user1', { email: 'john.updated@example.com' });

await usersTable.delete('user1');
```

1.  **Synchronization:**

```typescript
// Synchronize data between the local database and the PocketBase server
await pokeDex.sync();
```

## API Reference

### `PokeDex` Class

*   **`constructor(dbName: string, pbSchema: PbCollection[], url?: string)`:**
    *   `dbName`: The name of your IndexedDB database.
    *   `pbSchema`: The parsed `pbschema.json` data (an array of `PbCollection` objects).
    *   `url`: The URL of your PocketBase instance (defaults to `'http://127.0.0.1:8090'`).
*   **`async init(): Promise<void>`:** Initializes the database connection. Call this after creating a `PokeDex` instance.
*   **`async getTable<T extends { id: string; created?: string; updated?: string }>(collectionName: string): Promise<Table<T, string>>`:** Gets a type-safe reference to a Dexie.js table for the specified collection. `T` should be an interface representing the data structure of the collection.
*   **`async sync(): Promise<void>`:** Performs bi-directional synchronization between the local database and the PocketBase server.

### `PbCollection` Interface

```typescript
interface PbCollection {
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
  // ... other PocketBase collection properties ...
}
```

### `PbField` Interface

```typescript
interface PbField {
  name: string;
  type: string;
  required: boolean;
  // ... other PocketBase field properties ...
}
```

## Schema Conversion

The `convertSchema` function (which you can import from `schema.ts` if you separated it into a module) handles the conversion from `pbschema.json` to a Dexie.js schema. The core logic is in the `pbFieldToDexieIndex` and `processCollectionIndexes` functions.

*   **`pbFieldToDexieIndex(field: PbField): string`:** Converts a PocketBase field definition to a Dexie.js index string.
*   **`processCollectionIndexes(indexes: string[]): string[]`:** Parses PocketBase index definitions to create corresponding Dexie.js compound indexes.

## Conflict Resolution

Currently, the `syncToServer` method uses a **"client wins"** conflict resolution strategy. If a record has been modified both locally and on the server, the local version will overwrite the server version.

**Future improvements:**

*   Implement more sophisticated conflict resolution strategies (e.g., "server wins," last-write-wins, or custom merge logic).
*   Provide options for the developer to choose the desired conflict resolution strategy.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

1.  Fork the repository.
2.  Create a new branch: `git checkout -b feat/my-new-feature`
3.  Make your changes and commit them: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin feat/my-new-feature`
5.  Submit a pull request.

## License

MIT
