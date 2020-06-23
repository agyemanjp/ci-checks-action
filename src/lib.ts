/* eslint-disable global-require */
import * as https from 'https'
import * as shell from "shelljs"

/** Helper function for making HTTP requests
 * @param {string | URL} url - Request URL
 * @param {object} options - Request options
 * @returns {Promise<object>} - JSON response
 */
function request1(url: string, options: https.RequestOptions & { body?: any }) {
	return new Promise((resolve, reject) => {
		const req = https
			.request(url, options, (res) => {
				let data = ""
				res.on("data", (chunk) => { data += chunk })
				res.on("end", () => {
					if (!res.statusCode || res.statusCode >= 400) {
						const err = new Error(`Received status code ${res.statusCode}`)
						Object.assign(err, { res, data })
						reject(err)
					}
					else {
						resolve({ res, data: JSON.parse(data) })
					}
				})
			})
			.on("error", reject)

		if (options.body) {
			req.end(JSON.stringify(options.body))
		}
		else {
			req.end()
		}
	})
}

function request2(url: string, options: https.RequestOptions & { body: any }) {
	return new Promise((resolve, reject) => {
		const req = https
			.request(url, options, res => {
				let data = '';
				res.on('data', chunk => {
					data += chunk;
				});
				res.on('end', () => {
					if (res.statusCode === undefined || res.statusCode >= 400) {
						const err = new Error(`Received status code ${res.statusCode}`)
						reject(Object.assign(err, { response: res, data }))
					} else {
						resolve({ res, data: JSON.parse(data) });
					}
				});
			})
			.on('error', reject);
		if (options.body) {
			req.end(JSON.stringify(options.body));
		} else {
			req.end();
		}
	});
}

/** Updates the global Git configuration with the provided information
 * @param {string} name - Git username
 * @param {string} email - Git email address
 */
function setUserInfo(name: string, email: string) {
	console.log(`Setting Git user information`)
	shell.exec(`git config --global user.name "${name}"`)
	shell.exec(`git config --global user.email "${email}"`)
}
/** Returns the SHA of the head commit
 * @returns {string} - Head SHA
 */
function getHeadSha() {
	const sha = shell.exec("git rev-parse HEAD").stdout
	console.log(`SHA of last commit is "${sha}"`)
	return sha
}
/** Checks whether there are differences from HEAD
 * @returns {boolean} - Boolean indicating whether changes exist
 */
function hasChanges() {
	const res = shell.exec("git diff-index --quiet HEAD --", { silent: true }).code === 1
	console.log(`${res ? "Changes" : "No changes"} found with Git`)
	return res
}
function parseInputArray(input: string) {
	return input
		.split(',')
		.reduce((acc, current) => [...acc, current.trim()], [] as Array<string>);
}
function exitWithError(errorMessage: string) {
	console.log(errorMessage, "error")
	process.exit(1)
}
function capitalizeFirstLetter(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1)
}
function removeTrailingPeriod(str: string) {
	return str[str.length - 1] === "." ? str.substring(0, str.length - 1) : str;
}

/*
class GithubClient {
	protected _client: ReturnType<typeof github.getOctokit>
	constructor(token: string) {
		this._client = github.getOctokit(token)
	}
	async startGitHubCheckAsync(info: ChecksCreateEndpoint) {
		try {
			const response = await this._client.checks.create({
				...info,
				started_at: new Date().toISOString(),
				status: 'in_progress'
			})
			return response.data.id
		}
		catch (e) {
			throw new Error(`startGitHubCheckAsync() error\n${e.message}\n`)
		}
	}
	async finishGitHubCheck(info:
		{
			repo: string,
			owner: string,
			check_run_id: number,
			conclusion: CheckConclusion,
			output: {
				annotations: Array<GitHubAnnotation>,
				title: string,
				summary: string
			}
		}) {
		try {
			await this._client.checks.update({
				...info,
				status: 'completed',
				completed_at: new Date().toISOString()
			})
		}
		catch (e) {
			exitWithError(e.message);
		}
	}
}
class EslintRunner {
	private name = 'Eslint'
	private githubClient: ReturnType<typeof github.getOctokit>
	private opts: Options
	checkRunID: number = -1

	constructor(ghToken: string, options: Options) {
		this.githubClient = github.getOctokit(ghToken)
		this.opts = options
	}

	run = async () => {
		this.checkRunID = await startGitHubCheckAsync()
		const report = this.runEslintCheck()!
		const { success, annotations, counts } = this.prepareAnnotation(report)

		// if annotations are too large, split them into check-updates
		let restOfAnnotation = await this.handleAnnotations(annotations, counts)

		finishGitHubCheck(success, restOfAnnotation, counts)
	}

	private prepareAnnotation = (report: CLIEngine.LintReport) => {
		// 0 - no error, 1 - warning, 2 - error
		const reportLevel = ['', 'warning', 'failure'];

		const githubAnnotations: Array<GitHubAnnotation> = [];
		report.results.forEach(result => {
			const { filePath, messages } = result;
			const path = filePath.replace(`${this.opts.repoPath} / `, '');

			for (let msg of messages) {
				const { ruleId, message, severity, endLine, line } = msg;

				const annotation: GitHubAnnotation = {
					path,
					start_line: line,
					end_line: endLine || line,
					annotation_level: reportLevel[severity] as GitHubAnnotationLevel,
					message: `${ruleId}: ${message}`,
				};

				githubAnnotations.push(annotation);
			}
		})

		return {
			success: report.errorCount === 0,
			annotations: githubAnnotations,
			counts: {
				error: report.errorCount,
				warning: report.warningCount,
			},
		}
	}
	private handleAnnotations = async (annotations: Array<GitHubAnnotation>, counts: ReportCounts) => {
		let leftAnnotations = [...annotations];
		if (leftAnnotations.length > 50) {
			while (leftAnnotations.length > 50) {
				let toProcess = leftAnnotations.splice(0, 50);
				try {
					await this.updateAnnotation(toProcess, counts);
				}
				catch (e) {
					exitWithError(`Fail processing annotations: ${e.message}`)
				}
			}
		}
		return leftAnnotations
	}
	private updateAnnotation = async (annotations: Array<GitHubAnnotation>, counts: ReportCounts) => {
		try {
			//head_sha: sha,
			//conclusion: lintResult.isSuccess ? "success" : "failure",
			//completed_at: completed ? new Date() : undefined,
			//status: completed ? 'completed' : 'in_progress',
			//output: {
			//title: capitalizeFirstLetter(summary),
			//summary: `${ linterName } found ${ summary }`,
			//chunk
			//}

			await this.githubClient.checks.update({
				name: "ESlint",
				owner: this.opts.repoOwner,
				repo: this.opts.repoName,
				check_run_id: this.checkRunID,
				started_at: String(new Date()),
				status: 'in_progress',
				output: {
					title: this.name,
					summary: `Found ${counts.error} error(s), ${counts.warning} warning(s).`,
					annotations,
				},
			})
		}
		catch (e) {
			exitWithError(e.message);
		}
	}



	private pathRelative = (location: string) => { return path.resolve(this.opts.repoPath, location) }

	private runEslintCheck = () => {
		try {
			const eslint = this.opts.eslint
			const cli = new CLIEngine({
				//useEslintrc: eslintCfg.configFile !== undefined,
				configFile: eslint.configFile ? this.pathRelative(eslint.configFile) : undefined,
				extensions: eslint.extensions,
				ignorePattern: eslint.ignoreGlobs,
				errorOnUnmatchedPattern: eslint.errorOnUnmatchedPattern,
				fix: eslint.autoFix,
				cwd: this.opts.repoPath,
			})

			return cli.executeOnFiles(this.opts.eslint.inputGlobs.map(this.pathRelative))
		}
		catch (e) {
			exitWithError(e.message)
		}
	}
}
class ESLintWrapper {
	static get name() {
		return "ESLint";
	}

	static async verifySetup(dir, prefix = "") {
		// Verify that NPM is installed (required to execute ESLint)
		if (!(await commandExists("npm"))) {
			throw new Error("NPM is not installed");
		}

		// Verify that ESLint is installed
		const commandPrefix = prefix || getNpmBinCommand(dir);
		try {
			run(`${ commandPrefix } eslint - v`, { dir });
		} catch (err) {
			throw new Error(`${ this.name } is not installed`);
		}
	}

	static lint(dir, extensions, args = "", fix = false, prefix = "") {
		const extensionsArg = extensions.map((ext) => `.${ ext }`).join(",");
		const fixArg = fix ? "--fix" : "";
		const commandPrefix = prefix || getNpmBinCommand(dir);
		return run(
			`${ commandPrefix } eslint--ext ${ extensionsArg } ${ fixArg } --no - color--format json ${ args } "."`,
			{
				dir,
				ignoreErrors: true,
			},
		);
	}

	static parseOutput(dir, output) {
		const lintResult = initLintResult();
		lintResult.isSuccess = output.status === 0;

		let outputJson;
		try {
			outputJson = JSON.parse(output.stdout);
		} catch (err) {
			throw Error(
				`Error parsing ${ this.name } JSON output: ${ err.message }.Output: "${output.stdout}"`,
			);
		}

		for (const violation of outputJson) {
			const { filePath, messages } = violation;
			const path = filePath.substring(dir.length + 1);

			for (const msg of messages) {
				const { fatal, line, message, ruleId, severity } = msg;

				// Exit if a fatal ESLint error occurred
				if (fatal) {
					throw Error(`ESLint error: ${ message }`);
				}

				const entry = {
					path,
					firstLine: line,
					lastLine: line,
					message: `${ removeTrailingPeriod(message) }(${ ruleId })`,
				};
				if (severity === 1) {
					lintResult.warning.push(entry);
				} else if (severity === 2) {
					lintResult.error.push(entry);
				}
			}
		}

		return lintResult;
	}
}
*/