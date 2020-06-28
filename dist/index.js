"use strict";
/* eslint-disable camelcase */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-let */
/* eslint-disable no-await-in-loop */
/* eslint-disable fp/no-loops */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-namespace */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ajv_1 = __importDefault(require("ajv"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const generalCheckSchema = __importStar(require("./check-general.schema.json"));
const stdlib_1 = require("./stdlib");
function getInput(key, required = false) {
    return core.getInput(key, { required });
}
function getChecksToReport() {
    const checksInput = core.getInput('checks', { required: true });
    return checksInput
        .split("|")
        .map(check => {
        const [name, outputFileName] = check.split(":");
        return { name, outputFileName };
    });
}
function parse(generalCheckJSON, checkName) {
    var _a;
    const toValidate = JSON.parse(generalCheckJSON);
    const valid = new ajv_1.default().validate(generalCheckSchema, toValidate);
    if (valid === false) {
        throw new Error(`Error parsing check script output`);
    }
    const result = toValidate;
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
    const { byFile, summary, name, description, counts } = result;
    return {
        title: (_a = (checkName !== null && checkName !== void 0 ? checkName : name), (_a !== null && _a !== void 0 ? _a : "")),
        summary: (summary !== null && summary !== void 0 ? summary : `${counts.failure} failure(s) and ${counts.warning} warning(s) reported`),
        conclusion: counts.failure > 0 ? 'failure' : 'success',
        text: "",
        annotations: stdlib_1.flatten(Object.entries(byFile).map(kv => {
            const filePath = kv[0];
            const fileResult = kv[1];
            return fileResult.details.map(detail => {
                var _a, _b;
                return ({
                    path: filePath.replace(`${process.env.GITHUB_WORKSPACE}/`, ''),
                    message: detail.message,
                    start_line: (_a = detail.startLine, (_a !== null && _a !== void 0 ? _a : 0)),
                    start_column: detail.startColumn,
                    end_line: (_b = detail.endLine, (_b !== null && _b !== void 0 ? _b : 0)),
                    end_column: detail.endColumn,
                    annotation_level: detail.category
                });
            });
        })),
    };
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const pullRequest = github.context.payload.pull_request;
        const head_sha = pullRequest ? pullRequest.head.sha : github.context.sha;
        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        const githubToken = getInput('ghToken', true);
        const githubClient = new github.GitHub(githubToken);
        const BATCH_SIZE = 50;
        function getBaseInfo(opts) {
            return 'checkId' in opts
                ? { check_run_id: opts.checkId, owner, repo }
                : { name: opts.name, owner, repo, started_at: new Date().toISOString(), head_sha };
        }
        function postCheckAsync(info) {
            return __awaiter(this, void 0, void 0, function* () {
                const { data: { id: checkId } } = 'check_run_id' in info
                    ? yield githubClient.checks.update(info)
                    : yield githubClient.checks.create(info);
                return checkId;
            });
        }
        try {
            //const checks = getChecksToReport()
            for (const check of getChecksToReport()) {
                try {
                    if (check && check.name && check.outputFileName) {
                        const outputFilePath = path.resolve(check.outputFileName);
                        if (!fs.existsSync(outputFilePath)) {
                            core.warning(`Output file "${check.outputFileName}" for the "${check.name}" check not found.`);
                            continue;
                        }
                        const file = fs.readFileSync(check.outputFileName, 'utf8');
                        const { title, summary, conclusion, text, annotations } = parse(file, check.name);
                        if (conclusion !== "success") {
                            core.setFailed(`"${title}" check reported failures.`);
                        }
                        if (pullRequest) {
                            core.info("This is a PR...");
                            const checkId = yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo(check)), { status: 'in_progress' }));
                            const annotationBatches = [...stdlib_1.chunk(annotations, BATCH_SIZE)];
                            const batchNum = annotationBatches.length;
                            let batchIndex = 1;
                            for (const annotationBatch of stdlib_1.take(annotationBatches, batchNum - 1)) {
                                const batchMessage = `Processing annotations batch ${batchIndex++} of "${title}" check`;
                                core.info(batchMessage);
                                yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo({ checkId })), { status: 'in_progress', output: { title, summary: batchMessage, annotations: annotationBatch } }));
                            }
                            core.info(`Processing last batch of "${title}" check`);
                            yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo({ checkId })), { status: 'completed', conclusion, completed_at: new Date().toISOString(), output: { title, summary, text, annotations: stdlib_1.last(annotationBatches) } }));
                        }
                        else { // push
                            core.info("This is a push...");
                            yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo({ name: check.name })), { status: 'completed', conclusion, completed_at: new Date().toISOString(), output: { title, summary, text } }));
                        }
                    }
                }
                catch (e) {
                    const msg = 'message' in e ? e.message : String(e);
                    core.error(`Error processing requested check "${check.name}"\n\t${msg}\n`);
                    //core.setFailed('Error creating checks')
                }
            }
        }
        catch (err) {
            core.setFailed(err.message ? err.message : 'Error creating checks');
        }
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
                assert.deepEqual([...stdlib_1.chunk([], 50)], [1]);
            });
        });
    });
}
else {
    run();
}
// npm install --save @actions/core@1.2.0 @actions/github@1.1.0 @octokit/graphql@2.0.1 @octokit/rest@16.15.0
// npm install --save-dev typescript@3.7.2
// @octokit/endpoint@5.5.1 @octokit/rest@16.35.0 @octokit/request@5.3.1 @octokit/types@2.0.1 @octokit/graphql@2.1.3
// npm install --save @actions/core@latest @actions/github@latest
//# sourceMappingURL=index.js.map