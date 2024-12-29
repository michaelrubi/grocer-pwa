<script>
	import { Toaster } from 'svelte-sonner';
</script>

<Toaster
	position="top-center"
	closeButton
	toastOptions={{
		unstyled: true,
		classes: {
			toast: 'toast',
			title: 'toast-title',
			description: 'toast-description',
			actionButton: 'toast-action',
			cancelButton: 'toast-cancel',
			closeButton: 'toast-close',
			success: 'toast-success'
		}
	}}
/>
