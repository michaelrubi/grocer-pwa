<!-- +layout.svelte -->
<script lang="ts">
	import { pokerune } from '$lib/db';
	import Toaster from '$lib/components/Toaster.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import '$lib/style/app.css';
	const { children } = $props();

	const { userAuth } = $derived(pokerune);

	let deferredPrompt: any;
	let showInstallButton = $state(false);

	$effect(() => {
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			showInstallButton = true;
		});
	});

	function installApp() {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
				if (choiceResult.outcome === 'accepted') {
					console.log('User accepted the install prompt');
				} else {
					console.log('User dismissed the install prompt');
				}
				deferredPrompt = null;
				showInstallButton = false;
			});
		}
	}
</script>

<main class="primary-layout">
	{@render children()}
</main>

{#if userAuth}
	<Nav />
{/if}

{#if showInstallButton}
	<button
		onclick={installApp}
		class="btn primary"
		style="width: 96px; position: fixed; right: .75rem; top: .75rem; z-index: 1000;"
		>Install App</button
	>
{/if}

<Toaster />
