/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { OpenAI } from 'openai';
import * as cheerio from 'cheerio';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

async function read_website_content(url: string): Promise<string> {
	console.log('reading website content');
	const response = await fetch(url);
	const body = await response.text();
	const cheerioBody = cheerio.load(body);
	const resp = {
		website_body: cheerioBody('p').text(),
		url: url,
	};
	return JSON.stringify(resp);
}


export interface Env {
	OPENAI_API_KEY: string;
}



export default {
	async fetch(request: Request, env: { OPENAI_API_KEY: string }, ctx: ExecutionContext): Promise<Response> {
		if (!env.OPENAI_API_KEY) {
			return new Response('OPENAI_API_KEY is not set', { status: 500 });
		}

		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});

		const url = new URL(request.url);
		const message = url.searchParams.get('message');
		const messages: ChatCompletionMessageParam[] = [{ role: 'user', content: message || 'Summarize the content' }];

		const tools: any = [
			{
				type: 'function',
				function: {
					name: 'read_website_content',
					description: 'Read the content on a given website',
					parameters: {
						type: 'object',
						properties: {
							url: {
								type: 'string',
								description: 'The URL to the website to read',
							},
						},
						required: ['url'],
					},
				},
			},
		];

		const chatCompletion = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: messages,
			tools: tools,
			tool_choice: 'auto',
		});

		const assistantMessage = chatCompletion.choices[0].message;
		// Add the assistant's message to the messages array
		messages.push(assistantMessage);

		if (assistantMessage.tool_calls) {
			for (const toolCall of assistantMessage.tool_calls) {
				if (toolCall.function.name === 'read_website_content') {
					const url = JSON.parse(toolCall.function.arguments).url;
					const websiteContent = await read_website_content(url);
					messages.push({
						role: 'tool',
						tool_call_id: toolCall.id,
						name: toolCall.function.name,
						content: websiteContent,
					});
				}
			}

			const secondChatCompletion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: messages,
			});

			const secondAssistantMessage = secondChatCompletion.choices[0].message;

			const htmlResponse = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>URL Summary</title>
			</head>
			<body>
				<h1>Summary of ${url}</h1>
				<p>${secondAssistantMessage.content}</p>
			</body>
			</html>
			`;

			return new Response(htmlResponse, {
				headers: { 'Content-Type': 'text/html' },
			});
		} else {
			const htmlResponse = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>URL Summary</title>
			</head>
			<body>
				<h1>Summary of ${url}</h1>
				<p>${assistantMessage.content}</p>
			</body>
			</html>
			`;

			return new Response(htmlResponse, {
				headers: { 'Content-Type': 'text/html' },
			});
		}
	},
};
