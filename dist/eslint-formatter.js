"use strict";
/* eslint-disable fp/no-mutation */
Object.defineProperty(exports, "__esModule", { value: true });
const stdlib_1 = require("./stdlib");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = function (results, data) {
    const checkResult = {
        name: undefined,
        description: "ES Lint results",
        summary: undefined,
        counts: {
            failure: stdlib_1.sum(stdlib_1.map(results, r => r.errorCount)),
            warning: stdlib_1.sum(stdlib_1.map(results, r => r.warningCount)),
            notice: 0
        },
        byFile: stdlib_1.Dictionary(results.map(r => {
            return [r.filePath, {
                    summary: undefined,
                    counts: {
                        failure: r.errorCount,
                        warning: r.warningCount,
                        success: undefined
                    },
                    details: r.messages.map(msg => {
                        return {
                            Id: undefined,
                            message: msg.message,
                            category: ["notice", "warning", "failure"][msg.severity],
                            startLine: msg.line,
                            endLine: msg.endLine,
                            startColumn: msg.column,
                            endColumn: msg.endColumn,
                        };
                    })
                }];
        })).asObject()
    };
    return JSON.stringify(checkResult, null, 2);
};
//# sourceMappingURL=eslint-formatter.js.map