/* eslint-disable fp/no-loops */
import * as assert from 'assert'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as path from "path"
import * as fs from 'fs'
import { describe } from "mocha"

//#region Types
type ArgsType<F extends (...x: any[]) => any> = F extends (...x: infer A) => any ? A : never
interface ChecksCreateEndpoint {
	owner: string;
	repo: string;
    /** The name of the check. For example, "code-coverage".
     */
	name: string;
    /** The SHA of the commit.
     */
	head_sha: string;
    /** The URL of the integrator's site that has the full details of the check. If the integrator does not provide this, then the homepage of the GitHub app is used.
     */
	details_url?: string;
    /** A reference for the run on the integrator's system.
     */
	external_id?: string;
    /** The current status. Can be one of `queued`, `in_progress`, or `completed`.
     */
	status?: "queued" | "in_progress" | "completed";
    /** The time that the check run began. This is a timestamp in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: `YYYY-MM-DDTHH:MM:SSZ`.
     */
	started_at?: string;
    /** **Required if you provide `completed_at` or a `status` of `completed`**. The final conclusion of the check. Can be one of `success`, `failure`, `neutral`, `cancelled`, `skipped`, `timed_out`, or `action_required`. When the conclusion is `action_required`, additional details should be provided on the site specified by `details_url`.
     * **Note:** Providing `conclusion` will automatically set the `status` parameter to `completed`. Only GitHub can change a check run conclusion to `stale`.
     */
	conclusion?: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required";
    /** The time the check completed. This is a timestamp in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: `YYYY-MM-DDTHH:MM:SSZ`.
     */
	completed_at?: string;
    /** Check runs can accept a variety of data in the `output` object, including a `title` and `summary` and can optionally provide descriptive details about the run. See the [`output` object](https://developer.github.com/v3/checks/runs/#output-object) description.
     */
	output?: {
		title: string;
		summary: string;
		text?: string;
		annotations?: GitHubAnnotation[];
		images?: Array<{
			alt: string;
			image_url: string;
			caption?: string;
		}>;
	};
    /** Displays a button on GitHub that can be clicked to alert your app to do additional tasks. For example, a code linting app can display a button that automatically fixes detected errors. The button created in this object is displayed after the check run completes. When a user clicks the button, GitHub sends the [`check_run.requested_action` webhook](https://developer.github.com/webhooks/event-payloads/#check_run) to your app. Each action includes a `label`, `identifier` and `description`. A maximum of three actions are accepted. See the [`actions` object](https://developer.github.com/v3/checks/runs/#actions-object) description. To learn more about check runs and requested actions, see "[Check runs and requested actions](https://developer.github.com/v3/checks/runs/#check-runs-and-requested-actions)." To learn more about check runs and requested actions, see "[Check runs and requested actions](https://developer.github.com/v3/checks/runs/#check-runs-and-requested-actions)."
     */
	actions?: Array<{
		label: string;
		description: string;
		identifier: string;
	}>;
}
type GitHubAnnotationLevel = 'notice' | 'warning' | 'failure';
type CheckConclusion = "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required"
interface GitHubAnnotation {
	path: string;
	annotation_level: GitHubAnnotationLevel;
	start_line: number;
	start_column?: number;
	end_line: number;
	end_column?: number;
	message: string;
	raw_details?: string;
	title?: string;
}
interface CheckResult {
	filePath: string,
	messages: Array<{
		"ruleId": string,
		"severity": number,
		"message": string,
		"messageId": string,
		"nodeType": "Identifier",
		"line": number,
		"column": number,
		"endLine": number,
		"endColumn": number
	}>;
	errorCount: number;
	warningCount: number;

	"fixableErrorCount": number,
	"fixableWarningCount": number,
	"source": string,
	"usedDeprecatedRules": any[]
}

//#endregion


//#region Functions
function getInput(key: string, required = false) {
	return core.getInput(key, { required })
}
function* chunkArray<T>(arr: T[], chunkSize: number): Iterable<T[]> {
	let index = 0
	while (index < arr.length) {
		yield (arr.slice(index, index + chunkSize))
		index += 50
	}
}
//#endregion


/** Main function, does not support forks */
async function runAction() {
	const { GITHUB_REPOSITORY, GITHUB_WORKSPACE, GITHUB_SHA, GITHUB_EVENT_PATH, SOURCE_ROOT } = process.env
	const [repoOwner, repoName] = GITHUB_REPOSITORY!.split('/')
	const githubToken = getInput('ghToken', true)
	const pullRequest = github.context.payload.pull_request;
	const sha = GITHUB_SHA ?? (pullRequest ? pullRequest.head.sha : github.context.sha)
	const { context } = github

	const autoFix = getInput("auto_fix") === "true"
	const gitName = getInput("git_name", true)
	const gitEmail = getInput("git_email", true)
	const commitMessage = getInput("commit_message", true)

	//const options: Options = { repoName, repoOwner, repoPath: GITHUB_WORKSPACE!, sha: GITHUB_SHA! }
	//new EslintRunner(githubToken, options).run()


	function getChecksToReport() {
		const checksInput = core.getInput('checks', { required: true })
		return checksInput
			.split("|")
			.map(check => {
				let [name, outputFileName] = check.split(":")
				return { name, outputFileName }
			})
	}

	function parseOutput(output: string) {
		let results = JSON.parse(output) as CheckResult[]
		let info = results.reduce<{ errorCount: number, warningCount: number, annotations: GitHubAnnotation[] }>(
			(prev, current, index, arr) => {
				core.info(`Analyzing ${current.filePath}`)

				return {
					errorCount: prev.errorCount + current.errorCount,
					warningCount: prev.warningCount + current.warningCount,
					annotations: [...prev.annotations, ...current.messages.map(msg => {
						// Pull out information about the error/warning message
						const { line, endLine, column, endColumn, severity, ruleId, message } = msg
						const filePathTrimmed = current.filePath.replace(`${GITHUB_WORKSPACE}/`, '')

						// Create GitHub annotation for error/warning (https://developer.github.com/v3/checks/runs/#annotations-object)
						return {
							path: filePathTrimmed,
							start_line: line,
							end_line: endLine ? endLine : line,
							start_column: line === endLine ? column : undefined,
							end_column: line === endLine ? endColumn : undefined,
							annotation_level: ['notice', 'warning', 'failure'][severity] as GitHubAnnotationLevel,
							message: `[${ruleId}] ${message}`
						} as GitHubAnnotation

						// User-friendly markdown message text for the error/warning
						/*const link = `https://github.com/${OWNER}/${REPO}/blob/${SHA}/${filePathTrimmed}#L${line}:L${endLine}`
						let messageText = '### [`' + filePathTrimmed + '` line `' + line + '`](' + link + ')\n';
						messageText += '- Start Line: `' + line + '`\n';
						messageText += '- End Line: `' + endLine + '`\n';
						messageText += '- Message: ' + message + '\n';
						messageText += '  - From: [`' + ruleId + '`]\n';
		
						// Add the markdown text to the appropriate placeholder
						if (isWarning) {
							warningText += messageText
						} 
						else {
							errorText += messageText
						}
						*/
					})]
				}
			},

			{
				errorCount: 0,
				warningCount: 0,
				annotations: [] as GitHubAnnotation[],
				// errorText: '',
				// warningText: '',
				// markdownText: ''
			} as const
		)

		return {
			...info,
			success: info.errorCount === 0,
			summary: `${info.errorCount} error(s) and ${info.warningCount} warning(s) reported`
		}
	}

	function buildCheckInfo(checkName: string, parsedResults: ReturnType<typeof parseOutput>): ChecksCreateEndpoint[] {
		return [...chunkArray(parsedResults.annotations, 50)].map(batch => ({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			started_at: new Date().toISOString(),
			head_sha: sha,
			completed_at: new Date().toISOString(),
			status: 'completed',
			name: checkName,
			conclusion: parsedResults.success ? 'success' : 'failure',
			output: {
				title: checkName,
				summary: parsedResults.summary,
				//text: parsedCheckResults.markdown,
				annotations: batch
			}
		}))
	}

	const githubClient = github.getOctokit(githubToken)
	getChecksToReport().forEach(check => {
		const outputFilePath = path.resolve(check.outputFileName)
		if (!fs.existsSync(outputFilePath)) {
			core.setFailed(`Output file "${check.outputFileName}" for the ${check.name} check not be resolved.`)
			return
		}
		const file = fs.readFileSync(check.outputFileName, 'utf8')
		const parsedOutput = parseOutput(file/*, check.type*/)
		if (parsedOutput.errorCount > 0) {
			core.setFailed(`${check.name} check failed.`)
		}
		const checkInfoBatches = buildCheckInfo(check.name, parsedOutput)
		try {
			checkInfoBatches.forEach(async batch => {
				//let x: ArgsType<typeof githubClient.checks.create>;// = batch
				await githubClient.checks.create({ ...batch })

				/*
					async function createCheck(sha: string, lintResult: Record<string, Result[]>, summary: string) {
						try {
							//const url = `https://api.github.com/repos/${repoName}/check-runs`
							const url = `https://api.github.com/repos/${owner}/${repoName}/check-runs`

							const headers = {
								"Content-Type": "application/json",
								Accept: "application/vnd.github.antiope-preview+json", //required to access Checks API during preview period
								Authorization: `Bearer ${githubToken}`,
								"User-Agent": `eslint-annotate_action`,
							}

							const body = {
								name: "ESlint",
								head_sha: sha,
								conclusion: lintResult.isSuccess ? "success" : "failure",
								started_at: new Date(),
								//completed_at: completed ? new Date() : undefined,
								//status: completed ? 'completed' : 'in_progress',
								output: {
									//title: capitalizeFirstLetter(summary),
									//summary: `${linterName} found ${summary}`,
									chunk
								}
							}

							//(`Creating GitHub check with ${annotations.length} annotations for ${linterName}…`)
							await request(url, { method: "POST", headers, body })
							//log(`${linterName} check created successfully`)
						}
						catch (err) {
							log(err, "error")
							throw new Error(`Error trying to create GitHub check for ${linterName}: ${err.message}`);
						}
					}
				*/
			})
		}
		catch (err) {
			core.setFailed(`Error creating annotations for ${check.name} on Github\n${err.message}`)
		}
	})
}


process.on("unhandledRejection", (err: any) => {
	console.error(err, "error")
	throw new Error(`Exiting due to unhandled promise rejection`)
})


if (process.env.MOCHA) {

	describe('Index', function () {
		describe('#chunkArray()', function () {
			it('should return empty array when given empty array', function () {
				assert.deepEqual([...chunkArray([], 50)], [])
			})
		})
	})
}
