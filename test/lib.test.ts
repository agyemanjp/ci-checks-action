/* eslint-disable no-useless-escape */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-loops */

import * as assert from "assert"
import { parse, getChecksToReport } from "../dist/lib"
// import { GitHubAnnotation, GithubCheckInfo } from "./check-github"

describe('parse()', function () {
	const lintReport = `{
		"description": "ES Lint results",
		"counts": {
			"failure": 1,
			"warning": 1,
			"notice": 0
		},
		"byFile": {
			"/Users/prmph/Code/ci-checks-action/src/check-general.schema.json": {
				"counts": {
					"failure": 0,
					"warning": 1
				},
				"details": [
					{
					"message": "File ignored because of a matching ignore pattern. Use --no-ignore to override.",
					"category": "warning"
					}
				]
			},
			"/Users/prmph/Code/ci-checks-action/src/check-general.ts": {
			"counts": {
				"failure": 0,
				"warning": 0
			},
			"details": []
			},
			"/Users/prmph/Code/ci-checks-action/src/check-github.ts": {
			"counts": {
				"failure": 0,
				"warning": 0
			},
			"details": []
			},
			"/Users/prmph/Code/ci-checks-action/src/index.ts": {
				"counts": {
					"failure": 1,
					"warning": 0
				},
				"details": [
					{
						"message": "Extra semicolon.",
						"category": "failure",
						"startLine": 64,
						"endLine": 64,
						"startColumn": 63,
						"endColumn": 64
					}
				]
			},
			"/Users/prmph/Code/ci-checks-action/src/utility.ts": {
			"counts": {
				"failure": 0,
				"warning": 0
			},
			"details": []
			},
			"/Users/prmph/Code/ci-checks-action/src/check-general.test.json": {
				"counts": {
					"failure": 0,
					"warning": 1
				},
				"details": [
					{
				"message": "Extra semicolon.",
				"category": "failure",
				"startLine": 65,
				"endLine": 70,
				"startColumn": 63,
				"endColumn": 64
				}
				]
			}
		}
	}`

	const wrongFormatReport = `{
		"description": "ES Lint results",
		"counts": [object Object]
	}`

	const testReport = `{
		"name": "Mocha unit tests",
		"description": "Mocha unit tests",
		"summary": "",
		"counts": {
			"failure": 0,
			"warning": 0,
			"notice": 21
		},
		"byFile": {
			"/Users/prmph/Code/ci-checks-action/dist/index.test.js": {
			"counts": {
				"failure": 0,
				"warning": 0,
				"notice": 21
			},
			"details": [
				{
				"Id": "flatten()",
				"title": "flatten() should return a result that excludes empty arrays",
				"message": "'should return a result that excludes empty arrays' passed",
				"category": "notice"
				},
				{
				"Id": "flatten()",
				"title": "flatten() should treat strings as primitives, not iterables",
				"message": "'should treat strings as primitives, not iterables' passed",
				"category": "notice"
				},
				{
				"Id": "take()",
				"title": "take() should return array with length equal to the smaller of input array length and take count",
				"message": "'should return array with length equal to the smaller of input array length and take count' passed",
				"category": "notice"
				},
				{
				"Id": "take()",
				"title": "take() should return empty array for an input empty array",
				"message": "'should return empty array for an input empty array' passed",
				"category": "notice"
				},
				{
				"Id": "take()",
				"title": "take() should return empty array for take count of 0",
				"message": "'should return empty array for take count of 0' passed",
				"category": "notice"
				},
				{
				"Id": "take()",
				"title": "take() should return empty array for negative take count",
				"message": "'should return empty array for negative take count' passed",
				"category": "notice"
				},
				{
				"Id": "take()",
				"title": "take() should be idempotent for pure iterables",
				"message": "'should be idempotent for pure iterables' passed",
				"category": "notice"
				},
				{
				"Id": "chunk()",
				"title": "chunk() should return empty array when given empty array",
				"message": "'should return empty array when given empty array' passed",
				"category": "notice"
				},
				{
				"Id": "chunk()",
				"title": "chunk() should return a one-element array for an input array of length less than chunk size",
				"message": "'should return a one-element array for an input array of length less than chunk size' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for an empty array",
				"message": "'should return true for an empty array' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for a non-empty array",
				"message": "'should return true for a non-empty array' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return false for an empty string",
				"message": "'should return false for an empty string' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return false for a whitespace string",
				"message": "'should return false for a whitespace string' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for a non-empty string",
				"message": "'should return true for a non-empty string' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for the boolean value <false>",
				"message": "'should return true for the boolean value <false>' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for a function",
				"message": "'should return true for a function' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for an empty object",
				"message": "'should return true for an empty object' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for a symbol",
				"message": "'should return true for a symbol' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return false for the value <undefined>",
				"message": "'should return false for the value <undefined>' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return true for the number <0>",
				"message": "'should return true for the number <0>' passed",
				"category": "notice"
				},
				{
				"Id": "hasValue()",
				"title": "hasValue() should return false for the number <NaN>",
				"message": "'should return false for the number <NaN>' passed",
				"category": "notice"
				}
			]
			}
		}
	}`

	const changedFiles = [
		`/Users/prmph/Code/ci-checks-action/.github/workflows/default.yml`,
		`/Users/prmph/Code/ci-checks-action/dist/index.js`,
		`/Users/prmph/Code/ci-checks-action/package-lock.json`,
		`/Users/prmph/Code/ci-checks-action/package.json`,
		`/Users/prmph/Code/ci-checks-action/src/index.ts`,
		`/Users/prmph/Code/ci-checks-action/test/index.test.ts`
	]

	// Conclusion = "success" | "failure" | "neutral" | "cancelled" | "timed_out" | "action_required" | undefined

	it('should return no annotations, if changed files is an empty array', function () {
		/*const expected = {
			"title": "lint",
			"summary": "File ignored because of a matching ignore pattern. Use \"--no-ignore\" to override.",
			"conclusion": "failure",
			"text": "",
			"annotations": []
		}*/

		const annotations = [...parse(lintReport, [], undefined).annotations]

		assert.deepStrictEqual(annotations, [])
	})

	it('should return all annotations, if changed files is undefined', function () {
		const annotations = [...parse(lintReport, undefined, "lint").annotations]
		assert.deepStrictEqual(annotations.map(a => a.path), [
			`/Users/prmph/Code/ci-checks-action/src/check-general.schema.json`,
			`/Users/prmph/Code/ci-checks-action/src/index.ts`,
			"/Users/prmph/Code/ci-checks-action/src/check-general.test.json"]
		)
	})

	it('should return annotations for changed files only, if changed files is a non-empty array', function () {
		const annotations = [...parse(lintReport, changedFiles, "lint").annotations]
		assert.deepStrictEqual(annotations.map(a => a.path), [`/Users/prmph/Code/ci-checks-action/src/index.ts`])
	})

	it('should not repeat annotations', function () {
		const annotations = [...parse(testReport, changedFiles, "lint").annotations]
		assert.deepStrictEqual(annotations.length, new Set(annotations).size)
	})

	it('should include endColumn and startColumn in the annotation when the startLine and endLine are the same', function () {
		const annotations = [...parse(lintReport, ["/Users/prmph/Code/ci-checks-action/src/index.ts"], "lint").annotations]

		assert.strictEqual(Object.keys(annotations[0]).includes("start_column"), true)
		assert.strictEqual(Object.keys(annotations[0]).includes("end_column"), true)
	})

	it('should omit endColumn and startColumn in the annotation when the startLine and endLine are different', function () {
		const annotations = [...parse(lintReport, ["/Users/prmph/Code/ci-checks-action/src/check-general.test.json"], "lint").annotations]

		assert.strictEqual(Object.keys(annotations[0]).includes("start_column"), false)
		assert.strictEqual(Object.keys(annotations[0]).includes("end_column"), false)
	})

	it('should return information about a wrongly formatted file instead of throwing an error', function () {
		const report = parse(wrongFormatReport, [], "lint")

		assert.strictEqual(report.title, "Could not parse the output file")
	})
})
