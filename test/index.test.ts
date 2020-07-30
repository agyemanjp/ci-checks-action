/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-loops */

import * as assert from "assert"
import { flatten, hasValue } from "./utility"

describe('#flatten()', function () {
	it('should return a result that excludes empty arrays', function () {

		const actual = [...flatten([
			[{
				"path": "src/check-general.schema.json",
				"message": "File ignored because of a matching ignore pattern. Use \"--no-ignore\" to override.",
				"start_line": 0,
				"end_line": 0,
				"annotation_level": "warning"
			}],
			[],
			[],
			[],
			[]
		])]

		const expected = [{
			"path": "src/check-general.schema.json",
			"message": "File ignored because of a matching ignore pattern. Use \"--no-ignore\" to override.",
			"start_line": 0,
			"end_line": 0,
			"annotation_level": "warning"
		}]

		assert.deepEqual(actual, expected)
	})

	it('should treat strings as primitives, not iterables', function () {
		const actual = [...flatten([["annotation"], ["simplicity"]])]
		const expected = ["annotation", "simplicity"]
		assert.deepEqual(actual, expected)
	})
})


describe('hasValue()', function () {
	it('should return true for an empty array', function () {
		assert.equal(hasValue([]), true)
	})
	it('should return true for a non-empty array', function () {
		assert.equal(hasValue([1, 2, 3]), true)
	})
	it('should return false for an empty string', function () {
		assert.equal(hasValue(""), false)
	})
	it('should return false for a whitespace string', function () {
		assert.equal(hasValue(" "), false)
		assert.equal(hasValue(`
		`), false)
		assert.equal(hasValue("		"), false)
	})
	it('should return true for a non-empty string', function () {
		assert.equal(hasValue("abc"), true)
	})
	it('should return true for the boolean value "false"', function () {
		assert.equal(hasValue(false), true)
	})
	it('should return true for a function', function () {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		assert.equal(hasValue(() => { }), true)
	})
	it('should return true for an empty object', function () {
		assert.equal(hasValue({}), true)
	})
	it('should return true for a symbol', function () {
		assert.equal(hasValue(Symbol()), true)
	})
	it('should return false for the value "undefined"', function () {
		assert.equal(hasValue(undefined), false)
	})
	it('should return true for the number "0"', function () {
		assert.equal(hasValue(0), true)
	})
	it('should return false for the number "NaN"', function () {
		assert.equal(hasValue(NaN), false)
		assert.equal(hasValue(Number.NaN), false)
	})
})