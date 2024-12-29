<!-- Item.svelte -->
<script lang="ts">
	import type { Item, Store } from '$lib/types';
	import { pokerune } from '$lib/db';

	const { stores } = $derived(pokerune);
	const currentStore = $derived.by(findStore);

	function findStore(): Store | undefined {
		return stores.find((store: Store) => store.id === item.store);
	}

	function getBGColor(store?: Store) {
		if (!store) return '#ccc';
		return store.color;
	}

	function getTextColor(store?: Store) {
		if (!store) return 'var(--txt-dark)';
		const rgb = store.color

			.slice(1)
			.match(/.{2}/g)!
			.map((val) => parseInt(val, 16));
		const luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
		return luma < 180 ? 'var(--txt-dark)' : 'var(--txt-light)';
	}

	let { item, ...rest }: { item: Item } = $props();
</script>

<div
	class="item"
	{...rest}
	style="background-color: {getBGColor(currentStore)}; --txt-clr: {getTextColor(currentStore)}"
>
	<div class="item__name">
		{item.name}
	</div>
</div>
