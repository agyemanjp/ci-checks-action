/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable fp/no-let */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable camelcase */

export namespace GithubCheckInfo {

	export interface CreateBase {
		name: string,
		owner: string,
		repo: string,
		head_sha: string,
		started_at: string, // time stamp
	}

	export interface UpdateBase {
		check_run_id: number,
		owner: string,
		repo: string
	}
	export interface CompletedCreate extends CreateBase {
		status: 'completed'
		completed_at: string,
		conclusion: GitHubAnnotation.Conclusion,
		output: GitHubAnnotation.Output
	}
	export interface InProgressCreate extends CreateBase {
		status: "in_progress";
		output?: GitHubAnnotation.Output;
	}
	export interface InProgressUpdate extends UpdateBase {
		status: "in_progress"
		output?: GitHubAnnotation.Output
	}

	export interface CompletionUpdate extends UpdateBase {
		status: 'completed'
		completed_at: string,
		conclusion: GitHubAnnotation.Conclusion,
		output: GitHubAnnotation.Output
	}

	export type Update = CompletionUpdate | InProgressUpdate
	export type Create = CompletedCreate | InProgressCreate
	export type Any = Create | Update
}

export interface GitHubAnnotation {
	path: string;
	annotation_level: GitHubAnnotation.Level;
	start_line: number;
	start_column?: number;
	end_line: number;
	end_column?: number;
	message: string;
	raw_details?: string;
	title?: string;
}

export namespace GitHubAnnotation {
	export type Level = 'notice' | 'warning' | 'failure'
	export type Conclusion = "success" | "failure" | "neutral" | "cancelled" | "timed_out" | "action_required" | undefined
	export interface Output {
		title: string,
		summary: string,
		text?: string,
		annotations?: GitHubAnnotation[]
	}
}


/*
export interface CodeCheckResult {
	name: string
	message?: string;
	description?: string;

	counts: {
		failure: number;
		warning?: number;
		success?: number;
	};

	byFile: Record<string, {
		//filePath: string;
		message?: string;
		description?: string;

		counts: {
			failure: number;
			warning?: number;
			success?: number;
		}

		details: Array<{
			Id?: string,
			message: string,
			description?: string,
			category: "success" | "warning" | "failure",
			startLine?: number,
			startColumn?: number,
			endLine?: number,
			endColumn?: number
		}>;
	}>;
}
*/



