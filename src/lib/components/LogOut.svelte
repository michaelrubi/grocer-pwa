<script lang="ts">
	import { pokerune } from '$lib/db';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	const { pb, userAuth } = $derived(pokerune);

	function signOut() {
		const tempUser = userAuth?.username;
		pb.authStore.clear();
		toast.message(`Logged out ${tempUser} successfully!`);
		goto('/login');
	}
</script>

{#if userAuth}
	<button class="btn-icon" onclick={signOut}> Logout </button>
{/if}
