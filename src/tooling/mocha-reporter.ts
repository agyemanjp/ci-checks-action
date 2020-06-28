/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable fp/no-mutation */

import * as mocha from 'mocha'
import { CheckGeneralSchema } from "./check-general"


interface TestFailure {
	"stack": string;
	"message": string,
	"generatedMessage": boolean,
	"name": string,
	"code": string,
	"actual": string, //json
	"expected": string, //json
	"operator": string
}


module.exports = function (this: unknown, runner: mocha.Runner) {
	mocha.reporters.Base.call(this, runner)

	const results: CheckGeneralSchema = {
		name: "Mocha unit tests",
		description: "Mocha unit tests",
		summary: "",
		counts: { failure: 0, warning: 0, notice: 0 },
		byFile: {},
	}

	function addResult(test: Mocha.Test, message: string, category: "notice" | "failure" | "warning") {
		results.counts[category] = results.counts[category]! + 1
		const filePath = test.file!
		if (results.byFile[filePath] === undefined) {
			results.byFile[filePath] = { counts: { failure: 0, warning: 0, notice: 0 }, details: [] }
		}
		const fileResult = results.byFile[filePath]!
		fileResult.counts[category] = fileResult.counts[category]! + 1
		// eslint-disable-next-line fp/no-mutation
		fileResult.details = [...fileResult.details, { Id: test.title, message, category }]
	}

	runner.on('pass', function (test) {
		addResult(test, `"${test.title}" passed`, "notice")
	})

	runner.on('fail', function (test, err: TestFailure) {
		addResult(test, `"${test.fullTitle()}" failed\nExpected:${err.expected}\nActual:${err.actual}`, "failure")
	})

	runner.on('end', function () {
		console.log(JSON.stringify(results))
	})
}


//console.log('pass: %s', test.fullTitle())
		// console.log(/*'pass: %s', */JSON.stringify({
		// 	title: test.fullTitle(),
		// 	titlePath: test.titlePath(),
		// 	duration: test.duration,
		// 	file: test.file,
		// 	speed: test.speed,
		// 	state: test.state,
		// 	isAsync: test.async,
		// 	//x: test.body,
		// 	functionName: test.fn?.name
		// }))