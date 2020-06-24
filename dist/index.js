"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable fp/no-loops */
const assert = require("assert");
const core = require("@actions/core");
const github = require("@actions/github");
const path = require("path");
const fs = require("fs");
//#endregion
//#region Functions
function getInput(key, required = false) {
    return core.getInput(key, { required });
}
function* chunkArray(arr, chunkSize) {
    let index = 0;
    while (index < arr.length) {
        yield (arr.slice(index, index + chunkSize));
        index += 50;
    }
}
//#endregion
function runAction() {
    return __awaiter(this, void 0, void 0, function* () {
        const { GITHUB_REPOSITORY, GITHUB_WORKSPACE, GITHUB_SHA, GITHUB_EVENT_PATH, SOURCE_ROOT } = process.env;
        const githubToken = getInput('ghToken', true);
        const pullRequest = github.context.payload.pull_request;
        const sha = GITHUB_SHA !== null && GITHUB_SHA !== void 0 ? GITHUB_SHA : (pullRequest ? pullRequest.head.sha : github.context.sha);
        // const { context } = github
        // const autoFix = getInput("auto_fix") === "true"
        // const gitName = getInput("git_name", true)
        // const gitEmail = getInput("git_email", true)
        // const commitMessage = getInput("commit_message", true)
        // const options: Options = { repoName, repoOwner, repoPath: GITHUB_WORKSPACE!, sha: GITHUB_SHA! }
        // new EslintRunner(githubToken, options).run()
        function getChecksToReport() {
            const checksInput = core.getInput('checks', { required: true });
            return checksInput
                .split("|")
                .map(check => {
                let [name, outputFileName] = check.split(":");
                return { name, outputFileName };
            });
        }
        function parseOutput(output) {
            let results = JSON.parse(output);
            let info = results.reduce((prev, current, index, arr) => {
                return {
                    errorCount: prev.errorCount + current.errorCount,
                    warningCount: prev.warningCount + current.warningCount,
                    annotations: [...prev.annotations, ...current.messages.map(msg => {
                            // Pull out information about the error/warning message
                            const { line, endLine, column, endColumn, severity, ruleId, message } = msg;
                            const filePathTrimmed = current.filePath.replace(`${GITHUB_WORKSPACE}/`, '');
                            // Create GitHub annotation for error/warning (https://developer.github.com/v3/checks/runs/#annotations-object)
                            return {
                                path: filePathTrimmed,
                                start_line: line,
                                end_line: endLine ? endLine : line,
                                start_column: line === endLine ? column : undefined,
                                end_column: line === endLine ? endColumn : undefined,
                                annotation_level: ['notice', 'warning', 'failure'][severity],
                                message: `[${ruleId}] ${message}`
                            };
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
                };
            }, {
                errorCount: 0,
                warningCount: 0,
                annotations: [],
            });
            return Object.assign(Object.assign({}, info), { success: info.errorCount === 0, summary: `${info.errorCount} error(s) and ${info.warningCount} warning(s) reported` });
        }
        function buildCheckInfo(checkName, parsedResults) {
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
            }));
        }
        const githubClient = github.getOctokit(githubToken);
        getChecksToReport().forEach(check => {
            const outputFilePath = path.resolve(check.outputFileName);
            if (!fs.existsSync(outputFilePath)) {
                core.warning(`Output file "${check.outputFileName}" for the ${check.name} check not be resolved.`);
                return;
            }
            const file = fs.readFileSync(check.outputFileName, 'utf8');
            const parsedOutput = parseOutput(file /*, check.type*/);
            if (parsedOutput.errorCount > 0) {
                core.warning(`${check.name} check failed.`);
            }
            const checkInfoBatches = buildCheckInfo(check.name, parsedOutput);
            try {
                checkInfoBatches.forEach((batch) => __awaiter(this, void 0, void 0, function* () {
                    core.info(`Creating github check batch for ${JSON.stringify(batch)}`);
                    let r = yield githubClient.checks.create(Object.assign({}, batch));
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
                }));
            }
            catch (err) {
                core.setFailed(`Error creating annotations for ${check.name} on Github\n${err.message}`);
            }
        });
    });
}
process.on("unhandledRejection", (err) => {
    console.error(err, "error");
    throw new Error(`Exiting due to unhandled promise rejection`);
});
if (process.env.MOCHA) {
    describe('Index', function () {
        describe('#chunkArray()', function () {
            it('should return empty array when given empty array', function () {
                assert.deepEqual([...chunkArray([], 50)], []);
            });
        });
    });
}
else {
    runAction();
}
