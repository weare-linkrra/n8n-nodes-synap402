import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Synap402Api implements ICredentialType {
	name = 'synap402Api';

	displayName = 'Synap402 API';

	icon: Icon = { light: 'file:../icons/synap402.svg', dark: 'file:../icons/synap402.dark.svg' };

	documentationUrl = 'https://github.com/weare-linkrra/n8n-nodes-synap402#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Synap402 API key. Create one at https://synap402.com.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// GET /v1/models is public, so it cannot prove a key works. The balance
	// endpoint answers 401 for a missing or invalid key and 200 for a valid one.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://synap402.com/v1',
			url: '/credits/balance',
			method: 'GET',
		},
	};
}
