import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
	ISupplyDataFunctions,
} from 'n8n-workflow';

export const SYNAP402_BASE_URL = 'https://synap402.com/v1';

export const CREDENTIAL_NAME = 'synap402Api';

type SynapModel = {
	id: string;
	available?: boolean;
	context_length?: number | null;
	routing?: string;
};

type ModelsResponse = {
	data?: SynapModel[];
};

export async function synap402Request(
	this: IExecuteFunctions | ILoadOptionsFunctions | ISupplyDataFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
): Promise<IDataObject> {
	return (await this.helpers.httpRequestWithAuthentication.call(this, CREDENTIAL_NAME, {
		method,
		url: `${SYNAP402_BASE_URL}${path}`,
		body,
		json: true,
	})) as IDataObject;
}

export async function searchModels(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const response = (await synap402Request.call(this, 'GET', '/models')) as ModelsResponse;
	const query = (filter ?? '').toLowerCase();

	const results: INodeListSearchItems[] = (response.data ?? [])
		.filter((model) => model.available !== false)
		.filter((model) => model.id.toLowerCase().includes(query))
		.map((model) => ({
			name: model.id,
			value: model.id,
			url: 'https://synap402.com/models',
		}));

	return { results };
}
