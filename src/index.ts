/* eslint-disable brace-style */
/* eslint-disable camelcase */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-let */
/* eslint-disable no-await-in-loop */
/* eslint-disable fp/no-loops */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-namespace */

import * as fs from "fs"
import * as path from "path"

import Ajv from 'ajv'
import Octokit from '@octokit/rest'
import * as core from '@actions/core'
import * as github from '@actions/github'

import { flatten, take, last, chunk } from "./utility"
import { GithubCheckInfo, GitHubAnnotation } from "./check-github"
import { CheckGeneralSchema } from "./check-general"
import * as generalCheckSchema from "./check-general.schema.json"

function getInput(key: string, required = false) {
	return core.getInput(key, { required })
}
function getChecksToReport() {
	const checksInput = core.getInput('checks', { required: true })
	return checksInput
		.split("|")
		.map(check => {
			const [name, outputFileName] = check.split(":")
			return { name, outputFileName }
		})
}
function parse(generalCheckJSON: string, changedFiles: string[] | undefined, checkName: string | undefined) {
	// console.log(`Parsing check JSON: "${generalCheckJSON}"`)
	// console.log(`changed files: ${changedFiles}`)

	const toValidate = JSON.parse(generalCheckJSON)
	const valid = new Ajv().validate(generalCheckSchema, toValidate)
	if (valid === false) {
		throw new Error(`Error parsing check script output`)
	}
	const result = toValidate as CheckGeneralSchema

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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { byFile, summary, name, description, counts } = result
	//core.info(`Check results by file: ${JSON.stringify(byFile)}`) 

	return {
		title: checkName ?? name ?? "",
		summary: summary ?? `${counts.failure} failure(s) and ${counts.warning} warning(s) reported`,
		conclusion: counts.failure > 0 ? 'failure' : 'success' as GitHubAnnotation.Conclusion,
		text: "",
		annotations: flatten(Object.entries(byFile)
			.filter(kv => changedFiles === undefined || changedFiles.includes(kv[0]))
			.map(kv => {
				const filePath = kv[0]
				// console.log(`Processing ${checkName} check file "${filePath}"`)

				const fileResult = kv[1]
				return fileResult.details.map(detail => {
					// console.log(`Processing "${checkName}" check\n\tfile "${filePath}"\n\tdetail "${JSON.stringify(detail)}"`)

					return {
						path: filePath.replace(`${process.env.GITHUB_WORKSPACE}/`, ''),
						title: detail.title,
						message: detail.message,
						start_line: detail.startLine ?? 0,
						start_column: detail.startColumn,
						end_line: detail.endLine ?? 0,
						end_column: detail.endColumn,
						annotation_level: detail.category as GitHubAnnotation.Level
					} as GitHubAnnotation
				})
			})
		),
		// errorText: '',
		// warningText: '',
		// markdownText: ''
	}
}

async function run(): Promise<void> {
	const pullRequest = github.context.payload.pull_request
	const head_sha = pullRequest ? pullRequest.head.sha : github.context.sha
	const owner = github.context.repo.owner
	const repo = github.context.repo.repo
	const githubToken = getInput('ghToken', true)
	const githubClient = new github.GitHub(githubToken) as unknown as Octokit
	const BATCH_SIZE = 50

	function getBaseInfo(opts: { checkId: number }): { check_run_id: number, owner: string, repo: string }
	function getBaseInfo(opts: { name: string }): { name: string, owner: string, repo: string, started_at: string, head_sha: string }
	function getBaseInfo(opts: { checkId: number } | { name: string }) {
		return 'checkId' in opts
			? { check_run_id: opts.checkId, owner, repo }
			: { name: opts.name, owner, repo, started_at: new Date().toISOString(), head_sha }
	}

	async function getChangedFilesAsync(prNumber: number): Promise<string[]> {
		const { data: prInfo } = await githubClient.pulls.get({
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			number: prNumber
		})

		let changedFiles = [] as string[]

		const fetchPerPage = 100
		for (let pageIndex = 0; pageIndex * fetchPerPage < prInfo.changed_files; pageIndex++) {
			const listFilesResponse = await githubClient.pulls.listFiles({
				owner: github.context.repo.owner,
				repo: github.context.repo.repo,
				number: prNumber,
				page: pageIndex,
				per_page: fetchPerPage,
			})

			//const pattern = core.getInput("pattern")
			//const re = new RegExp(pattern.length ? pattern : ".*")

			changedFiles = changedFiles.concat(listFilesResponse.data.filter(f => f.status !== "removed").map(f => f.filename))

			/*listFilesResponse.data
				//.filter(f => re.test(f.filename))
				.forEach(f => {
					// eslint-disable-next-line fp/no-mutating-methods
					if (f.status === "added") changedFiles.created.push(f.filename)
					// eslint-disable-next-line fp/no-mutating-methods
					else if (f.status === "removed") changedFiles.deleted.push(f.filename)
					// eslint-disable-next-line fp/no-mutating-methods
					else if (f.status === "modified") changedFiles.updated.push(f.filename)
					else if (f.status === "renamed") {
						// eslint-disable-next-line fp/no-mutating-methods
						changedFiles.created.push(f.filename)

						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						if (re.test((f as any)["previous_filename"])) {
							// eslint-disable-next-line fp/no-mutating-methods, @typescript-eslint/no-explicit-any
							changedFiles.deleted.push((f as any)["previous_filename"])
						}
					}
				})
			*/
		}
		return changedFiles
	}

	async function postCheckAsync(info: GithubCheckInfo.Any) {
		const { data: { id: checkId } } = 'check_run_id' in info
			? await githubClient.checks.update(info)
			: await githubClient.checks.create(info)
		return checkId
	}

	try {
		const changedFiles = pullRequest ? await getChangedFilesAsync(pullRequest.number) : undefined
		console.log(`changed files: ${changedFiles}`)
		core.info(`changed files: ${changedFiles}`)

		for (const check of getChecksToReport()) {
			try {
				if (check && check.name && check.outputFileName) {
					const outputFilePath = path.resolve(check.outputFileName)
					if (!fs.existsSync(outputFilePath)) {
						core.warning(`Output file "${check.outputFileName}" for the "${check.name}" check not found.`)
						continue
					}

					const file = fs.readFileSync(check.outputFileName, 'utf8')
					const {
						title,
						summary,
						conclusion,
						text,
						annotations: annotationsIterable
					} = parse(file, changedFiles, check.name)
					const annotations = [...annotationsIterable]
					console.log(`${title} check annotations length: ${annotations.length}`)

					if (conclusion !== "success") {
						core.setFailed(`"${title}" check reported failures.`)
					}

					// core.info("This is a PR...")
					const checkId = await postCheckAsync({ ...getBaseInfo(check), status: 'in_progress' })

					// console.log(`\nAnnotations: ${JSON.stringify([...annotations])}`)
					const annotationBatches = [...chunk(annotations, BATCH_SIZE)]
					//console.log(`\nAnnotation Batches: ${JSON.stringify([...annotationBatches])}`)

					const numBatches = annotationBatches.length
					console.log(`${check.name} check: number of batches = ${numBatches}`)

					let batchIndex = 1
					for (const annotationBatch of take(annotationBatches, numBatches - 1)) {
						const batchMessage = `Processing annotations batch ${batchIndex++} of "${title}" check`
						core.info(batchMessage)
						await postCheckAsync({
							...getBaseInfo({ checkId }), status: 'in_progress',
							output: { title, summary: batchMessage, annotations: annotationBatch }
						})
					}

					core.info(`Posting annotations completions for "${title}" check`)
					await postCheckAsync({
						...getBaseInfo({ checkId }),
						status: 'completed',
						conclusion,
						completed_at: new Date().toISOString(),
						output: { title, summary, text, annotations: last(annotationBatches) }
					})

					/*if (push) {
						core.info(`Processing last batch of "${title}" check`)
						await postCheckAsync({
							...getBaseInfo({ name: check.name }),
							...getBaseInfo({ checkId }),
							status: 'completed',
							conclusion,
							completed_at: new Date().toISOString(),
							output: { title, summary, text }
							output: { title, summary, text, annotations: last(annotationBatches) }
						})
					}*/
				}
			}
			catch (e) {
				const msg = `Error processing requested check "${check.name}"\n\t${'stack' in e ? e.stack : 'message' in e ? e.message : String(e)}\n`
				core.error(msg)
				core.setFailed(msg)
			}
		}
	}
	catch (err) {
		core.setFailed(err.message ? err.message : 'Error creating checks')
	}
}

process.on("unhandledRejection", (err) => {
	console.error(err, "error")
	throw new Error(`Exiting due to unhandled promise rejection`)
})


run()

