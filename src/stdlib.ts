/* eslint-disable no-unused-expressions */
/* eslint-disable fp/no-rest-parameters */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-loops */


export type Primitive = number | string | symbol
//export type ObjectLiteral<TKey extends string = string, TValue = unknown> = { [key in TKey]: TValue }

type UnwrapIterable1<T> = T extends Iterable<infer X> ? X : T
type UnwrapIterable2<T> = T extends Iterable<infer X> ? UnwrapIterable1<X> : T
type UnwrapIterable3<T> = T extends Iterable<infer X> ? UnwrapIterable2<X> : T
export type UnwrapNestedIterable<T> = T extends Iterable<infer X> ? UnwrapIterable3<X> : T

export type Tuple<X, Y> = [X, Y]

export const Tuple = class <X, Y>  {
	constructor(x: X, y: Y) {
		return [x, y] as Tuple<X, Y>
	}
} as { new <X, Y>(x: X, y: Y): [X, Y] }

export type Ranker<X = unknown> = (a: X, b: X) => number
export type Comparer<X = unknown> = (a: X, b: X) => boolean
export type Projector<X = unknown, Y = unknown> = (value: X) => Y
export type Predicate<X = unknown> = (value: X) => boolean
export type Reducer<X = unknown, Y = unknown> = (prev: Y, current: X) => Y

export function* take<T>(iterable: Iterable<T>, n: number): Iterable<T> {
	if (typeof n !== "number") throw new Error(`Invalid type ${typeof n} for argument "n"\nMust be number`)
	if (n < 0) throw new Error(`Invalid value ${n} for argument "n"\nMust be zero or positive number`)

	if (n > 0) {
		for (const element of iterable) {
			yield element
			if (--n <= 0) break
		}
	}
}
export function* skip<T>(iterable: Iterable<T>, n: number): Iterable<T> {
	if (typeof n !== "number") throw new Error(`Invalid type ${typeof n} for argument "n"\nMust be number`)
	if (n < 0) throw new Error(`Invalid value ${n} for argument "n"\nMust be zero or positive number`)

	for (const element of iterable) {
		if (n === 0)
			yield element
		else
			n--
	}
}
export function* reduce<X, Y>(iterable: Iterable<X>, initial: Y, reducer: Reducer<X, Y>): Iterable<Y> {
	for (const element of iterable) {
		initial = reducer(initial, element)
		yield initial
	}
}
export function* map<X, Y>(iterable: Iterable<X>, projector: Projector<X, Y>): Iterable<Y> {
	for (const element of iterable) {
		yield projector(element)
	}
}
export function* chunk<T>(arr: Iterable<T>, chunkSize: number): Iterable<T[]> {
	const batch = [...take(arr, chunkSize)]
	if (batch.length) {
		yield batch
		yield* chunk(skip(arr, chunkSize), chunkSize)
	}
}
export function first<T>(iterable: Iterable<T>): T | undefined {
	for (const element of iterable) {
		return element
	}
}
export function last<T>(iterable: Iterable<T>): T | undefined {
	// eslint-disable-next-line fp/no-let
	let result: T | undefined = undefined
	for (const element of iterable) {
		result = element
	}
	return result
}
export function sum(iterable: Iterable<number>) {
	return last(reduce(iterable, 0, (prev, curr) => prev + curr)) ?? 0
}
export function* flatten<X>(target: Iterable<X>): Iterable<UnwrapNestedIterable<X>> {
	for (const element of target) {
		if (element !== undefined && element !== null && typeof element[Symbol.iterator] === 'function')
			yield* flatten(element as unknown as Iterable<X>)
		else
			yield element as UnwrapNestedIterable<X>
	}

	/*
		const flatten = function(arr, result = []) {
		for (let i = 0, length = arr.length; i < length; i++) {
			const value = arr[i];
			if (Array.isArray(value)) {
			flatten(value, result);
			} else {
			result.push(value);
			}
		}
		return result;
		};
	*/
}

//#region Object functions
export const Dictionary = <K extends string, V>(source: Iterable<Tuple<K, V>> | Record<K, V>) => {
	const obj = typeof source[Symbol.iterator] !== "function"
		? source as Record<K, V>
		: (() => {
			const o = {} as Record<K, V>
			for (const kv of source as Iterable<Tuple<K, V>>)
				o[kv[0]] = kv[1]
			return o
		})()


	return {
		keys: () => Object.keys(obj),
		values: () => Object.values(obj),
		entries: () => Object.entries(obj) as Array<Tuple<K, V>>,
		map: function <Y>(projector: Projector<V, Y>) {
			return Dictionary(this.entries().map(kv => new Tuple(kv[0], projector(kv[1]))))
		},
		pick(...keys: K[]) {
			return Dictionary(keys.map(k => new Tuple(k, obj[k])))
		},
		asObject() {
			return obj
		}
	}
}

//#endregion
