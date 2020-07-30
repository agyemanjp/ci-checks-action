/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-loops */

import * as assert from "assert"
import { flatten, chunk, hasValue, take } from "./utility"

describe('flatten()', function () {
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

describe('take()', function () {
	it('should return array with length equal to the smaller of input array length and take count', function () {
		assert.deepEqual([...take([10, 20, 30, 40], 7)], [10, 20, 30, 40])
		assert.deepEqual([...take([10, 20, 30, 40], 2)], [10, 20])
	})
	it('should return empty array for an input empty array', function () {
		assert.deepEqual([...take([], 7)], [])
	})
	it('should return empty array for take count of 0', function () {
		assert.deepEqual([...take([5, 2, 3, 1], 0)], [])
	})
	it('should return empty array for negative take count', function () {
		assert.deepEqual([...take([5, 2, 3, 1], -3)], [])
	})
	it('should be idempotent for pure iterables', function () {
		const arr = [10, 20, 99, 3, 30, 40]
		assert.deepEqual([...take(arr, 4)], [...take(arr, 4)])
	})
})

describe('chunk()', function () {
	it('should return empty array when given empty array', function () {
		assert.deepEqual([...chunk([], 50)], [])
	})
	it('should return a one-element array for an input array of length less than chunk size', function () {
		const actual = [...chunk([{
			"path": "src/check-general.schema.json",
			"message": "File ignored because of a matching ignore pattern. Use \"--no-ignore\" to override.",
			"start_line": 0,
			"end_line": 0,
			"annotation_level": "warning"
		}], 50)]

		const expected = [[{
			"path": "src/check-general.schema.json",
			"message": "File ignored because of a matching ignore pattern. Use \"--no-ignore\" to override.",
			"start_line": 0,
			"end_line": 0,
			"annotation_level": "warning"
		}]]

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