/* eslint-disable fp/no-mutation */

import { ESLint } from "eslint"
import { CheckGeneralSchema } from "./check-general"

import { map, Dictionary, sum } from "./stdlib"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = function (results: ESLint.LintResult[], data?: ESLint.LintResultData) {
	const chekResult: CheckGeneralSchema = {
		name: undefined,
		description: "ES Lint results",
		summary: undefined,
		counts: {
			failure: sum(map(results, r => r.errorCount)),
			warning: sum(map(results, r => r.warningCount)),
			notice: 0
		},
		byFile: Dictionary(results.map(r => {
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
						category: ["notice", "warning", "failure"][msg.severity] as "notice" | "warning" | "failure",
						startLine: msg.line,
						endLine: msg.endLine,
						startColumn: msg.column,
						endColumn: msg.endColumn,
					}
				})
			}]
		})).asObject()
	}
	return JSON.stringify(chekResult, null, 2)
}