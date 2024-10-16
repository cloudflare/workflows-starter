import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
	// Add your bindings here, e.g. KV, D1, AI, etc.
	MYWORKFLOW: Workflow;
};

// User-defined params passed to your workflow
type Params = {
	email: string;
	metadata: Record<string, string>;
};

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		// Can access bindings on `this.env`
		// Can access params on `event.params`

		const files = await step.do('my first step', async () => {
			// Fetch a list of files from $SOME_SERVICE
			return {
				inputParams: event,
				files: [
					'doc_7392_rev3.pdf',
					'report_x29_final.pdf',
					'memo_2024_05_12.pdf',
					'file_089_update.pdf',
					'proj_alpha_v2.pdf',
					'data_analysis_q2.pdf',
					'notes_meeting_52.pdf',
					'summary_fy24_draft.pdf',
				],
			};
		});

		const apiResponse = await step.do('some other step', async () => {
			let resp = await fetch('https://api.cloudflare.com/client/v4/ips');
			return await resp.json<any>();
		});

		await step.sleep('wait on something', '1 minute');

		await step.do(
			'make a call to write that could maybe, just might, fail',
			// {
			// 	retries: {
			// 		limit: 5,
			// 		delay: '5 second',
			// 		backoff: 'exponential',
			// 	},
			// 	timeout: '15 minutes',
			// },
			async () => {
				// Do stuff here, with access to my_value!
				if (Math.random() > 0.5) {
					throw new Error('API call to $STORAGE_SYSTEM failed');
				}
			}
		);
	}
}

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		let id = new URL(req.url).searchParams.get('instanceId');

		// Get the status of an existing instance, if provided
		if (id) {
			let instance = await env.MYWORKFLOW.get(id);
			return Response.json({
				status: await instance.status(),
			});
		}

		// Spawn a new instance and return the ID and status
		const newId = await crypto.randomUUID();
		let instance = await env.MYWORKFLOW.create(newId, {});
		return Response.json({
			id: instance.id,
			details: await instance.status(),
		});
	},
};