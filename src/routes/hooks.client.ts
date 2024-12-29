// hooks.client.ts
import { pokerune } from '$lib/db';
import type { HandleClientError } from '@sveltejs/kit';

pokerune.pb.authStore.onChange(() => {
	document.cookie = pokerune.pb.authStore.exportToCookie({ httpOnly: false });
}, true);

export const handleError: HandleClientError = ({ error, event }) => {
	console.error('An error occurred on the client side:', error, event);
	// You can add more error handling logic here if needed
	return {
		message: 'An unexpected error occurred.',
		code: 'UNEXPECTED_ERROR'
	};
};
