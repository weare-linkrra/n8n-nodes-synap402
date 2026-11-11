import { supplyModel } from '@n8n/ai-node-sdk';
import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { CREDENTIAL_NAME, SYNAP402_BASE_URL, searchModels } from '../Synap402/shared';

type ChatModelOptions = {
	maxTokens?: number;
	temperature?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	timeout?: number;
	maxRetries?: number;
};

export class LmChatSynap402 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Synap402 Chat Model',
		name: 'lmChatSynap402',
		icon: { light: 'file:../../icons/synap402.svg', dark: 'file:../../icons/synap402.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter.model.value}}',
		description: 'Use Synap402 open models with AI Agents and chains',
		defaults: {
			name: 'Synap402 Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/weare-linkrra/n8n-nodes-synap402#synap402-chat-model',
					},
				],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'synap402Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'resourceLocator',
				default: { mode: 'list', value: 'synap-v1' },
				required: true,
				description:
					'The model to use. For AI Agents that call tools, pick a model that supports tool calling.',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchModels',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. qwen3-coder-30b',
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						type: 'number',
						typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
						default: 0,
						description: 'Positive values reduce the likelihood of repeating the same text',
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						typeOptions: { minValue: 0 },
						default: 2,
						description: 'How many times to retry a failed request',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 1024,
						description: 'The maximum number of tokens to generate in the reply',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						type: 'number',
						typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
						default: 0,
						description: 'Positive values encourage the model to talk about new topics',
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
						default: 0.7,
						description: 'Higher values make the reply more random, lower values more focused',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 1000 },
						default: 120000,
						description: 'Maximum time a request may take, in milliseconds',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
						default: 1,
						description: 'Nucleus sampling: only consider tokens within this probability mass',
					},
				],
			},
		],
	};

	methods = {
		listSearch: {
			searchModels,
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials(CREDENTIAL_NAME);
		const model = String(
			this.getNodeParameter('model', itemIndex, '', { extractValue: true }) ?? '',
		).trim();
		if (!model) {
			throw new NodeOperationError(this.getNode(), 'No model selected', {
				itemIndex,
				description: 'Pick a model from the list or enter a model ID.',
			});
		}

		const options = this.getNodeParameter('options', itemIndex, {}) as ChatModelOptions;

		return supplyModel(this, {
			type: 'openai',
			baseUrl: SYNAP402_BASE_URL,
			apiKey: String(credentials.apiKey),
			model,
			useResponsesApi: false,
			supportsStrictToolCalling: false,
			temperature: options.temperature,
			maxTokens: options.maxTokens,
			topP: options.topP,
			frequencyPenalty: options.frequencyPenalty,
			presencePenalty: options.presencePenalty,
			timeout: options.timeout,
			maxRetries: options.maxRetries,
		});
	}
}
