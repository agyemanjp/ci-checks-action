"use strict";
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-let */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
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
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function* take(iterable, n) {
    if (typeof n !== "number")
        throw new Error(`Invalid type ${typeof n} for argument "n"\nMust be number`);
    if (n < 0)
        throw new Error(`Invalid value ${n} for argument "n"\nMust be zero or positive number`);
    if (n > 0) {
        for (const element of iterable) {
            yield element;
            if (--n <= 0)
                break;
        }
    }
}
function* skip(iterable, n) {
    if (typeof n !== "number")
        throw new Error(`Invalid type ${typeof n} for argument "n"\nMust be number`);
    if (n < 0)
        throw new Error(`Invalid value ${n} for argument "n"\nMust be zero or positive number`);
    for (const element of iterable) {
        if (n === 0)
            yield element;
        else
            n--;
    }
}
function* chunk(arr, chunkSize) {
    const batch = [...take(arr, chunkSize)];
    if (batch.length) {
        yield batch;
        yield* chunk(skip(arr, chunkSize), chunkSize);
    }
}
function postCheckAsync(info, ghClient) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data: { id: checkId } } = 'check_run_id' in info
            ? yield ghClient.checks.update(info)
            : yield ghClient.checks.create(info);
        return checkId;
    });
}
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
function parse(output) {
    const results = JSON.parse(output);
    const info = results.reduce((prev, current, index, arr) => {
        return {
            errorCount: prev.errorCount + current.errorCount,
            warningCount: prev.warningCount + current.warningCount,
            annotations: [...prev.annotations, ...current.messages.map(msg => {
                    // Pull out information about the error/warning message
                    const { line, endLine, column, endColumn, severity, ruleId, message } = msg;
                    const filePathTrimmed = current.filePath.replace(`${process.env.GITHUB_WORKSPACE}/`, '');
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
        try {
            for (const check of getChecksToReport()) {
                const outputFilePath = path.resolve(check.outputFileName);
                if (!fs.existsSync(outputFilePath)) {
                    core.warning(`Output file "${check.outputFileName}" for the ${check.name} check not found.`);
                    continue;
                }
                const file = fs.readFileSync(check.outputFileName, 'utf8');
                const parsedOutput = parse(file /*, check.type*/);
                const conclusion = parsedOutput.success ? 'success' : 'failure';
                if (!parsedOutput.success) {
                    core.setFailed(`${check.name} check reported ${parsedOutput.errorCount} errors.`);
                }
                if (pullRequest) {
                    core.info("This is a PR...");
                    const checkId = yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo(check)), { status: 'in_progress' }), githubClient);
                    const batches = [...chunk(parsedOutput.annotations, BATCH_SIZE)];
                    const batchNum = batches.length;
                    let batchIndex = 1;
                    for (const batch of take(batches, batchNum - 1)) {
                        const batchMessage = `Processing annotations batch ${batchIndex++} of ${check.name} check`;
                        core.info(batchMessage);
                        yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo({ checkId })), { status: 'in_progress', output: { title: check.name, summary: batchMessage, annotations: batch } }), githubClient);
                    }
                    core.info(`Processing last batch of ${check.name} check`);
                    yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo({ checkId })), { status: 'completed', conclusion, completed_at: new Date().toISOString(), output: { title: check.name, summary: parsedOutput.summary, annotations: batches[batchNum - 1] } }), githubClient);
                }
                else { // push
                    core.info("This is a push...");
                    yield postCheckAsync(Object.assign(Object.assign({}, getBaseInfo({ name: check.name })), { status: 'completed', completed_at: new Date().toISOString(), conclusion, output: { title: check.name, summary: parsedOutput.summary, } }), githubClient);
                }
            }
        }
        catch (err) {
            core.setFailed(err.message ? err.message : 'Error creating checks');
        }
    });
}
run();
process.on("unhandledRejection", (err) => {
    console.error(err, "error");
    throw new Error(`Exiting due to unhandled promise rejection`);
});
if (process.env.MOCHA) {
    describe('Index', function () {
        describe('#chunkArray()', function () {
            it('should return empty array when given empty array', function () {
                assert.deepEqual([...chunk([], 50)], []);
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