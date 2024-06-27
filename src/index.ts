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
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

async function call_sports_dept(customerQuery: string): Promise<string> {
	const response = await fetch('https://api.langbase.com/beta/generate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer pipe_5QHV1P2zQPKuaxqZjakateF9xTQweTRab4dyhTz2ccrzrhMEzRZAkTiF28b1ksHbHpnPqh9RZZev5Z1agnErHDGv',
		},
		body: JSON.stringify({
			messages: [
				{
					role: 'user',
					content: customerQuery,
				},
			],
		}),
	});
	const data = (await response.json()) as { choices: { message: { content: string } }[] };

	return data.choices[0].message.content;
}

async function call_electronics_dept(customerQuery: string): Promise<string> {
	try {
		const response = await fetch('https://api.langbase.com/beta/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer pipe_5QHV1P2zQPKuaxqZjakateF9xTQweTRab4dyhTz2ccrzrhMEzRZAkTiF28b1ksHbHpnPqh9RZZev5Z1agnErHDGv'
			},
			body: JSON.stringify({
				messages: [{
					role: 'user',
					content: customerQuery
				}]
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('API Response:', JSON.stringify(data, null, 2));

		// Check if data is a string (JSON string)
		if (typeof data === 'string') {
			try {
				const parsedData = JSON.parse(data);
				return `Ticket No.: ${parsedData['Ticket No.']}, Classification: ${parsedData['Classification']}`;
			} catch (parseError) {
				console.error('Error parsing JSON string:', parseError);
				return data; // Return the original string if parsing fails
			}
		}

		// If data is already an object
		if (data && typeof data === 'object') {
			return `Ticket No.: ${data['Ticket No.']}, Classification: ${data['Classification']}`;
		}

		throw new Error('Unexpected response format');
	} catch (error) {
		console.error('Error in call_electronics_dept:', error);
		return `Error processing request: ${error.message}, we are working on it please be patient`;
	}
}


async function call_travel_dept(customerQuery: string): Promise<string> {
	try{ 

		const response = await fetch('https://api.langbase.com/beta/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer pipe_43gXatvZihUuNHPkTB8HGviTfSiSXswNh8H1j2HjD2ZY2SdnuHhRVV7iFrbXC1Da5ZTNu3z1bVtyUuKZ4BaxZhow'
			},
			body: JSON.stringify({
				messages: [{
					role: 'user',
					content: customerQuery
				}]
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		console.log('API Response:', JSON.stringify(data, null, 2));

		// Check if data is a string (JSON string)
		if (typeof data === 'string') {
			try {
				const parsedData = JSON.parse(data);
				return `Ticket No.: ${parsedData['Ticket No.']}, Classification: ${parsedData['Classification']}`;
			} catch (parseError) {
				console.error('Error parsing JSON string:', parseError);
				return data; // Return the original string if parsing fails
			}
		}

		// If data is already an object
		if (data && typeof data === 'object') {
			return `Ticket No.: ${data['Ticket No.']}, Classification: ${data['Classification']}`;
		}

		throw new Error('Unexpected response format');
	} catch (error) {
		console.error('Error in call_travel_dept:', error);
		return `Error processing request: ${error.message}, we are working on it please be patient`;
	}
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
		const customerQuery = url.searchParams.get('query');
		if (!customerQuery) {
			return new Response('No query provided', { status: 400 });
		}

		const messages: ChatCompletionMessageParam[] = [
			{ role: 'system', content: 'You are a customer support assistant for TechBay, an online store that sells sports gear (including sports clothes), electronics and appliances, and travel bags and suitcases. Classify the customer query into one of these three categories and call the appropriate function.' },
			{ role: 'user', content: customerQuery }
		];

		const tools: any = [
			{
				type: 'function',
				function: {
					name: 'call_sports_dept',
					description: 'Call this function for queries related to sports gear and clothes',
					parameters: {
						type: 'object',
						properties: {
							customerQuery: {
								type: 'string',
								description: 'The customer query related to sports gear',
							},
						},
						required: ['customerQuery'],
					},
				},
			},
			{
				type: 'function',
				function: {
					name: 'call_electronics_dept',
					description: 'Call this function for queries related to electronics and appliances',
					parameters: {
						type: 'object',
						properties: {
							customerQuery: {
								type: 'string',
								description: 'The customer query related to electronics and appliances',
							},
						},
						required: ['customerQuery'],
					},
				},
			},
			{
				type: 'function',
				function: {
					name: 'call_travel_dept',
					description: 'Call this function for queries related to travel bags and suitcases',
					parameters: {
						type: 'object',
						properties: {
							customerQuery: {
								type: 'string',
								description: 'The customer query related to travel bags and suitcases',
							},
						},
						required: ['customerQuery'],
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
		let responseContent = '';

		if (assistantMessage.tool_calls) {
			for (const toolCall of assistantMessage.tool_calls) {
				const functionName = toolCall.function.name;
				const functionArgs = JSON.parse(toolCall.function.arguments);

				switch (functionName) {
					case 'call_sports_dept':
						responseContent = await call_sports_dept(functionArgs.customerQuery);
						break;
					case 'call_electronics_dept':
						responseContent = await call_electronics_dept(functionArgs.customerQuery);
						break;
					case 'call_travel_dept':
						responseContent = await call_travel_dept(functionArgs.customerQuery);
						break;
				}
			}
		} else {
			responseContent = assistantMessage.content || 'Sorry, I couldn\'t process your request.';
		}

		const htmlResponse = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>TechBay Customer Support</title>
		</head>
		<body>
		<h1>TechBay Customer Support</h1>
		<h2>Your Query:</h2>
		<p>${customerQuery}</p>
		<h2>Our Response:</h2>
		<p>${responseContent}</p>
		</body>
		</html>
    	`;

		return new Response(htmlResponse, {
			headers: { 'Content-Type': 'text/html' },
		});
	},
};
