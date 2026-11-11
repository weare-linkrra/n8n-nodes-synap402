import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { searchModels, synap402Request } from './shared';

type ChatMessage = { role: string; content: string };

type ChatCompletionResponse = IDataObject & {
	id?: string;
	model?: string;
	choices?: Array<{
		index?: number;
		finish_reason?: string | null;
		message?: IDataObject & { content?: string | null; reasoning?: string | null };
	}>;
	usage?: IDataObject;
	credits?: IDataObject;
};

export class Synap402 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Synap402',
		name: 'synap402',
		icon: { light: 'file:../../icons/synap402.svg', dark: 'file:../../icons/synap402.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Run open models (Qwen, Gemma, gpt-oss and more) through the Synap402 API',
		defaults: {
			name: 'Synap402',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'synap402Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					},
					{
						name: 'Model',
						value: 'model',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Complete',
						value: 'complete',
						action: 'Create a chat completion',
						description: 'Send messages to a model and get its reply',
					},
				],
				default: 'complete',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['model'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many models',
						description: 'List the models available to your key',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'resourceLocator',
				default: { mode: 'list', value: 'synap-v1' },
				required: true,
				description:
					'The model to use. "synap-v1" routes each request to the cheapest model that can handle it.',
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
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
				displayName: 'Messages',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				placeholder: 'Add Message',
				default: {
					values: [
						{
							role: 'user',
							content: '',
						},
					],
				},
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						displayName: 'Message',
						name: 'values',
						values: [
							{
								displayName: 'Role',
								name: 'role',
								type: 'options',
								options: [
									{
										name: 'Assistant',
										value: 'assistant',
									},
									{
										name: 'System',
										value: 'system',
									},
									{
										name: 'User',
										value: 'user',
									},
								],
								default: 'user',
							},
							{
								displayName: 'Content',
								name: 'content',
								type: 'string',
								typeOptions: {
									rows: 4,
								},
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Simplify Output',
				name: 'simplify',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				description:
					'Whether to return only the reply text, model, finish reason and token usage instead of the raw API response',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequency_penalty',
						type: 'number',
						typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
						default: 0,
						description: 'Positive values reduce the likelihood of repeating the same text',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'max_tokens',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 1024,
						description: 'The maximum number of tokens to generate in the reply',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
						default: 0,
						description: 'Positive values encourage the model to talk about new topics',
					},
					{
						displayName: 'Response Format',
						name: 'response_format',
						type: 'options',
						options: [
							{
								name: 'Text',
								value: 'text',
							},
							{
								name: 'JSON Object',
								value: 'json_object',
							},
						],
						default: 'text',
						description: 'Whether the model must reply with a valid JSON object',
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
						displayName: 'Stop Sequences',
						name: 'stop',
						type: 'string',
						default: '',
						description: 'Comma-separated sequences where the model stops generating',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource === 'model' && operation === 'getAll') {
					const response = await synap402Request.call(this, 'GET', '/models');
					const models = (response.data as IDataObject[] | undefined) ?? [];
					for (const model of models) {
						returnData.push({ json: model, pairedItem: { item: itemIndex } });
					}
					continue;
				}

				if (resource === 'chat' && operation === 'complete') {
					const model = this.getNodeParameter('model', itemIndex, '', {
						extractValue: true,
					}) as string;
					if (!model) {
						throw new NodeOperationError(this.getNode(), 'No model selected', {
							itemIndex,
							description: 'Pick a model from the list or enter a model ID.',
						});
					}

					const messageCollection = this.getNodeParameter('messages', itemIndex, {}) as {
						values?: ChatMessage[];
					};
					const messages = (messageCollection.values ?? []).filter(
						(message) => typeof message.content === 'string' && message.content.length > 0,
					);
					if (messages.length === 0) {
						throw new NodeOperationError(this.getNode(), 'No message content provided', {
							itemIndex,
							description: 'Add at least one message with content.',
						});
					}

					const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
					const body: IDataObject = { model, messages };
					for (const key of [
						'max_tokens',
						'temperature',
						'top_p',
						'frequency_penalty',
						'presence_penalty',
					]) {
						if (options[key] !== undefined) body[key] = options[key];
					}
					if (typeof options.stop === 'string' && options.stop.trim() !== '') {
						body.stop = options.stop
							.split(',')
							.map((sequence) => sequence.trim())
							.filter((sequence) => sequence.length > 0);
					}
					if (options.response_format === 'json_object') {
						body.response_format = { type: 'json_object' };
					}

					const response = (await synap402Request.call(
						this,
						'POST',
						'/chat/completions',
						body,
					)) as ChatCompletionResponse;

					const simplify = this.getNodeParameter('simplify', itemIndex, true) as boolean;
					if (!simplify) {
						returnData.push({ json: response, pairedItem: { item: itemIndex } });
						continue;
					}

					const choice = response.choices?.[0];
					const simplified: IDataObject = {
						content: choice?.message?.content ?? '',
						model: response.model ?? model,
						finishReason: choice?.finish_reason ?? null,
						usage: response.usage ?? {},
						id: response.id ?? null,
					};
					if (choice?.message?.reasoning) simplified.reasoning = choice.message.reasoning;
					if (response.credits) simplified.credits = response.credits;
					returnData.push({ json: simplified, pairedItem: { item: itemIndex } });
					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					`The operation "${operation}" is not supported for resource "${resource}"`,
					{ itemIndex },
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}
