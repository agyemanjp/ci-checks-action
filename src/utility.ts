/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-loops */
/* eslint-disable brace-style */


type UnwrapIterable1<T> = T extends Iterable<infer X> ? X : T
type UnwrapIterable2<T> = T extends Iterable<infer X> ? UnwrapIterable1<X> : T
type UnwrapIterable3<T> = T extends Iterable<infer X> ? UnwrapIterable2<X> : T
export type UnwrapNestedIterable<T> = T extends Iterable<infer X> ? UnwrapIterable3<X> : T

export function* flatten<X>(nestedIterable: Iterable<X>): Iterable<UnwrapNestedIterable<X>> {
	//console.log(`\nInput to flatten: ${JSON.stringify(nestedIterable)}`)

	for (const element of nestedIterable) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (typeof element !== "string" && typeof (element as any)[Symbol.iterator] === 'function') {
			//console.log(`flatten: element <${JSON.stringify(element)}> is iterable; flattening it *`)
			yield* flatten(element as unknown as Iterable<X>)
		}
		else {
			//console.log(`flatten: element <${JSON.stringify(element)}> is not iterable; yielding it *`)
			yield element as UnwrapNestedIterable<X>
		}
	}

}

export function* take<T>(iterable: Iterable<T>, n: number): Iterable<T> {
	if (typeof n !== "number") throw new Error(`Invalid type ${typeof n} for argument "n"\nMust be number`)
	if (n < 0) {
		console.warn(`Warning: Negative value ${n} passed to argument <n> of take()`)
		return
	}

	if (n > 0) {
		for (const element of iterable) {
			yield element
			if (--n <= 0) break
		}
	}
}

export function* skip<T>(iterable: Iterable<T>, n: number): Iterable<T> {
	if (typeof n !== "number")
		throw new Error(`Invalid type ${typeof n} for argument "n"\nMust be number`)
	if (n < 0) {
		console.warn(`Warning: Negative value ${n} passed to argument <n> of skip()`)
		return
	}

	for (const element of iterable) {
		if (n === 0)
			yield element
		else
			n--
	}
}

export function* filter<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): Iterable<T> {
	for (const element of iterable) {
		if (predicate(element))
			yield element
		else
			continue
	}
}

export function last<T>(collection: Iterable<T> | ArrayLike<T>, predicate?: (value: T) => boolean): T | undefined {

	// eslint-disable-next-line fp/no-let
	if ('length' in collection) {
		// Array-specific implementation of last() for better performance using direct elements access

		// eslint-disable-next-line fp/no-let
		for (let i = collection.length - 1; i >= 0; i--) {
			const element = collection[i]
			if (predicate === undefined || predicate(element))
				return element
		}
		return undefined
	}
	else {
		// eslint-disable-next-line fp/no-let
		let _last = undefined as T | undefined
		const iterable = predicate === undefined ? collection : filter(collection, predicate)
		for (const element of iterable) {
			_last = element
		}
		return _last
	}
}

export function* chunk<T>(iter: Iterable<T>, chunkSize: number): Iterable<T[]> {
	// console.log(`\n\tStarting chunk()`)

	const batch = [...take(iter, chunkSize)]
	// console.assert(batch.length === Math.min([...iter].length, chunkSize))
	// console.log(`\n\tBatch length ${batch.length}`)

	if (batch.length > 0) {
		// console.log(`\n\tYielding batch of length ${batch.length}`)
		// eslint-disable-next-line fp/no-unused-expression
		yield batch
		// eslint-disable-next-line fp/no-unused-expression
		yield* chunk(skip(iter, chunkSize), chunkSize)
	}
}

export function hasValue(value?: unknown): boolean {
	switch (typeof value) {
		case "function":
		case "boolean":
		case "bigint":
		case "object":
		case "symbol":
			return (value !== null)
		case "undefined":
			return false
		case "number":
			return (value !== null && !isNaN(value) && !Number.isNaN(value) && value !== Number.NaN)
		case "string":
			return value !== undefined && value !== null && value.trim().length > 0 && !/^\s*$/.test(value)
		//if(str.replace(/\s/g,"") == "") return false
	}

	return true
}