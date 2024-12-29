<!-- login/+page.svelte -->
<script lang="ts">
	import { pokerune } from '$lib/db';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	// import logo from '$lib/img/logo.svg';
	import LogOut from '$lib/components/LogOut.svelte';
	// import Icon from '$lib/components/Icon.svelte';

	const { pb, userAuth } = $derived(pokerune);
	// const { pb, userAuth } = $derived(server);

	async function login(provider: 'github' | 'google') {
		try {
			const authData = await pb.collection('user').authWithOAuth2({ provider });
			toast(`Logged in ${authData.record.username} successfully!`);
		} catch (error) {
			toast(`${provider} login failed. Please try again.`);
			console.error(error);
		}
	}

	$effect(() => {
		if (userAuth) {
			goto('/list');
		}
	});
</script>

<section id="login">
	<!-- <img src={logo} alt="Grocer" /> -->
	{#if userAuth}
		<LogOut />
	{:else}
		<form>
			<button class="btn alt-clr icon-child" onclick={() => login('google')}>
				<!-- <Icon icon="google" color="var(--txt-clr)">Login with Google</Icon> -->
				Login with Google
			</button>
			<button class="btn alt-clr icon-child" onclick={() => login('github')}>
				<!-- <Icon icon="github" color="var(--txt-clr)">Login with GitHub</Icon> -->
				Login with GitHub
			</button>
		</form>
	{/if}
</section>

<style>
	:global(.icon-child) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
</style>
