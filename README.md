# n8n-nodes-synap402

This is an n8n community node package for [Synap402](https://synap402.com), an OpenAI-compatible API for open models (Qwen, Gemma, gpt-oss and more), billed per token.

It contains two nodes:

- **Synap402**: send chat messages to a model and get the reply plus token usage, or list the models available to your key. Usable as an AI Agent tool.
- **Synap402 Chat Model**: a Chat Model sub-node you connect to the **AI Agent**, **Basic LLM Chain** and other AI root nodes.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Synap402 node](#synap402-node)
- [Synap402 Chat Model](#synap402-chat-model)
- [Example workflow](#example-workflow)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short: open **Settings → Community Nodes → Install**, enter `n8n-nodes-synap402`, and confirm.

## Credentials

1. Create an account and an API key at [synap402.com](https://synap402.com).
2. In n8n, create a new **Synap402 API** credential and paste the key into **API Key**.
3. Click **Test**. The test calls `GET https://synap402.com/v1/credits/balance` with your key, so it fails on a missing or invalid key.

The key is sent as `Authorization: Bearer <key>` to `https://synap402.com/v1`.

## Synap402 node

| Resource | Operation | What it does |
| --- | --- | --- |
| Chat | Complete | `POST /v1/chat/completions` with your messages |
| Model | Get Many | `GET /v1/models`, one item per model |

**Chat → Complete** parameters:

- **Model**: pick from the list (loaded live from `/v1/models`) or enter an ID. `synap-v1` routes each request to the cheapest model that can handle it.
- **Messages**: one or more messages with a role (`system`, `user`, `assistant`) and content. Expressions such as `{{ $json.text }}` work in the content.
- **Simplify Output** (default on): returns `content`, `model`, `finishReason`, `usage` (`prompt_tokens`, `completion_tokens`, `total_tokens`), `credits` and `id`. Turn it off to get the raw API response.
- **Options**: maximum number of tokens, sampling temperature, top P, frequency and presence penalty, stop sequences, and JSON response format.

## Synap402 Chat Model

Add an **AI Agent** (or **Basic LLM Chain**) node, click the **Chat Model** connector, and choose **Synap402 Chat Model**. Select the credential and a model.

For agents that call tools, pick a model that supports tool calling, for example `qwen3-coder-30b` or `qwen/qwen3-30b-a3b-instruct-2507`.

Options: maximum number of tokens, sampling temperature, top P, frequency and presence penalty, timeout and max retries.

## Example workflow

1. **Manual Trigger**
2. **Synap402** → Resource `Chat`, Operation `Complete`, Model `synap-v1`, one `user` message: `Summarize this in one sentence: {{ $json.text }}`
3. The output item has `content` with the reply and `usage.total_tokens` with the token count, which you can log to a sheet for cost tracking.

## Compatibility

- Requires n8n 1.x or 2.x with community nodes enabled.
- The **Synap402 Chat Model** node uses the n8n AI node SDK and needs an n8n version that ships `@n8n/ai-node-sdk` (n8n 2.x).
- Tested with n8n 2.47.

## Resources

- [Synap402](https://synap402.com)
- [Synap402 API docs](https://synap402.com/docs)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
