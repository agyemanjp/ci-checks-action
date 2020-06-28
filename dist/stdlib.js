"use strict";
/* eslint-disable no-unused-expressions */
/* eslint-disable fp/no-rest-parameters */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-loops */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tuple = class {
    constructor(x, y) {
        return [x, y];
    }
};
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
exports.take = take;
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
exports.skip = skip;
function* reduce(iterable, initial, reducer) {
    for (const element of iterable) {
        initial = reducer(initial, element);
        yield initial;
    }
}
exports.reduce = reduce;
function* map(iterable, projector) {
    for (const element of iterable) {
        yield projector(element);
    }
}
exports.map = map;
function* chunk(arr, chunkSize) {
    const batch = [...take(arr, chunkSize)];
    if (batch.length) {
        yield batch;
        yield* chunk(skip(arr, chunkSize), chunkSize);
    }
}
exports.chunk = chunk;
function first(iterable) {
    for (const element of iterable) {
        return element;
    }
}
exports.first = first;
function last(iterable) {
    // eslint-disable-next-line fp/no-let
    let result = undefined;
    for (const element of iterable) {
        result = element;
    }
    return result;
}
exports.last = last;
function sum(iterable) {
    var _a;
    return _a = last(reduce(iterable, 0, (prev, curr) => prev + curr)), (_a !== null && _a !== void 0 ? _a : 0);
}
exports.sum = sum;
function* flatten(target) {
    for (const element of target) {
        if (element !== undefined && element !== null && typeof element[Symbol.iterator] === 'function')
            yield* flatten(element);
        else
            yield element;
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
exports.flatten = flatten;
//#region Object functions
exports.Dictionary = (source) => {
    const obj = typeof source[Symbol.iterator] !== "function"
        ? source
        : (() => {
            const o = {};
            for (const kv of source)
                o[kv[0]] = kv[1];
            return o;
        })();
    return {
        keys: () => Object.keys(obj),
        values: () => Object.values(obj),
        entries: () => Object.entries(obj),
        map: function (projector) {
            return exports.Dictionary(this.entries().map(kv => new exports.Tuple(kv[0], projector(kv[1]))));
        },
        pick(...keys) {
            return exports.Dictionary(keys.map(k => new exports.Tuple(k, obj[k])));
        },
        asObject() {
            return obj;
        }
    };
};
//#endregion
//# sourceMappingURL=stdlib.js.map