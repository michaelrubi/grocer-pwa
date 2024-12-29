<script lang="ts">
	import Item from '$lib/components/Item.svelte';
	import type { Item as Items } from '$lib/types';

	const items: Items[] = [
		{
			id: '1',
			name: 'Soap',
			quantity: 10,
			store: 'Walmart',
			in_cart: true,
			created: new Date(),
			updated: new Date()
		},
		{
			id: '2',
			name: 'Toothpaste',
			quantity: 5,
			store: 'Target',
			in_cart: false,
			created: new Date(),
			updated: new Date()
		}
	];
</script>

<div class="item-list">
	{#each items as item}
		<Item {item} />
	{/each}
</div>
