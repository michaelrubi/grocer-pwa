<!-- +page.svelte -->
<script lang="ts">
	// import { server } from '$lib/db.svelte';
	import { pokerune } from '$lib/db';
	import { goto } from '$app/navigation';

	// const { userAuth } = $derived(server);
	const { userAuth } = $derived(pokerune);

	$effect(() => {
		if (!userAuth) {
			goto('/login');
		} else {
			goto('/list');
		}
	});
</script>

<div></div>
