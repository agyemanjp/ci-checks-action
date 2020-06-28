/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable fp/no-let */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable camelcase */


export namespace JSONSchema {
	type SchemaBase = {
		$id?: string
		$ref?: string
		type?: string
		title?: string
		description?: string
		default?: any
		examples?: any[]
	}
	type DefinitionsBase = { [name: string]: SchemaBase }
	type SchemaWithDefinitions<SchemaDefinitions extends DefinitionsBase> = SchemaBase & {
		definitions: SchemaDefinitions
	}

	type TypeName<T> =
		T extends null ? "null" :
		T extends string ? "string" :
		T extends any[] ? "array" :
		T extends number ? "number" :
		T extends boolean ? "boolean" :
		T extends undefined ? "undefined" :
		T extends Function ? "function" :
		"object";

	type WithID = { $id: string }

	type SchemaDeclaration<Type> = SchemaBase & { type: TypeName<Type>; $id?: string }
	type RefSchema<RefId extends string> = { $ref: RefId }
	type EnumSchema<BaseType, EnumType> = BaseType & { enum: EnumType[] }
	type UnionToIntersection<U> =
		(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

	type UndefinedSchema = SchemaDeclaration<undefined>

	type NumberSchema = SchemaDeclaration<number> & {
		multipleOf?: number
		minimun?: number
		exclusiveMinimum?: number
		maximum?: number
		exclusiveMaximum?: number
	}
	type StringSchema = SchemaDeclaration<string> & {
		pattern?: RegExp
		maxLength?: number
		minLength?: number
	}

	type ConstSchema<ConstType> = {
		const?: ConstType,
		enum?: ConstType[]
	} & (ConstType extends number ? NumberSchema :
		ConstType extends string ? StringSchema :
		ConstType extends boolean ? BoolSchema :
		never
		)


	type BoolSchema = SchemaDeclaration<boolean>
	type NullSchema = SchemaDeclaration<null>
	type LeafSchema = NumberSchema | StringSchema | BoolSchema | NullSchema

	type ObjectSchema<Props, ReqProps, AdditionalProps extends SchemaBase | null = null> = SchemaDeclaration<{}> & {
		required?: ReqProps[]
		properties?: Props
		additionalProperties?: AdditionalProps
		maxProperties?: number
		minProperties?: number
		patternProperties?: { [name: string]: SchemaBase }
		dependencies?: { [name: string]: SchemaBase | SchemaBase[] }
		propertyNames?: StringSchema
	}

	type CombinerSchema<ValueType extends SchemaBase, Operator extends string> = { [operator in Operator]: ValueType[] }
	type OperatorSchema<ValueType extends SchemaBase, Operator extends string> = { [operator in Operator]: ValueType }

	type IfThenElseSchema<If extends SchemaBase, Then extends SchemaBase, Else extends SchemaBase> = SchemaBase & {
		If: If
		Then: Then
		Else?: Else
	}

	type AllOf<ValueType extends SchemaBase> = CombinerSchema<ValueType, 'allOf'>
	type OneOf<ValueType extends SchemaBase> = CombinerSchema<ValueType, 'oneOf'>
	type AnyOf<ValueType extends SchemaBase> = CombinerSchema<ValueType, 'anyOf'>

	type Not<ValueType extends SchemaBase> = OperatorSchema<ValueType, 'not'>
	type ArraySchemaBase = SchemaDeclaration<any[]> & {
		maxItems?: number
		minItems?: number
		uniqueItems?: boolean
		contains?: SchemaBase
	}
	type ArraySchema<ValueSchema> = ArraySchemaBase & { items: ValueSchema extends any[] ? never : ValueSchema }
	type TupleSchema<TupleAsArray extends any[], AdditionalItemsSchema = null> = ArraySchemaBase & {
		items: TupleAsArray
		additionalItems?: AdditionalItemsSchema
	}

	type ResolveObjectRequiredProps<Props, RequiredPropNames> = [RequiredPropNames] extends [string] ? { [name in RequiredPropNames]: name extends keyof Props ? ResolveRecursive<Props[name]> : never } : unknown

	type ResolveObjectOptionalProps<Props> = Props extends null ? unknown : { [optKey in keyof Props]?: ResolveRecursive<Props[optKey]> }
	type ResolveObjectAdditionalProps<AdditionalPropsSchema> = AdditionalPropsSchema extends null ? unknown : { [key: string]: ResolveRecursive<AdditionalPropsSchema> }
	type ResolveObject<
		ObjectSchemaType extends ObjectSchema<Props, RequiredPropNames, SchemaForAdditionalProperties>,
		Props,
		RequiredPropNames,
		SchemaForAdditionalProperties extends SchemaBase | null
		> =
		ResolveObjectRequiredProps<Props, RequiredPropNames> & ResolveObjectOptionalProps<Props> & ResolveObjectAdditionalProps<SchemaForAdditionalProperties>

	interface ResolveArray<ValueType> extends Array<ResolveRecursive<ValueType>> { }

	// TODO: find a variadic way to do this, not sure it's possible with current typescript. https://github.com/Microsoft/TypeScript/issues/5453
	type AsTypedTupleSchema<Tuple> =
		Tuple extends [infer A, infer B] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>] :
		Tuple extends [infer A, infer B, infer C] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>] :
		Tuple extends [infer A, infer B, infer C, infer D] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>, ResolveRecursiveInternal<H>] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H, infer I] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>, ResolveRecursiveInternal<H>, ResolveRecursiveInternal<I>] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H, infer I, infer J] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>, ResolveRecursiveInternal<H>, ResolveRecursiveInternal<I>, ResolveRecursiveInternal<J>] :
		never

	type AsTypedTupleSchemaWithAdditional<Tuple, Additional> =
		Tuple extends [infer A, infer B] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C, infer D] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>, ResolveRecursiveInternal<H>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H, infer I] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>, ResolveRecursiveInternal<H>, ResolveRecursiveInternal<I>, ...(ResolveRecursiveInternal<Additional>[])] :
		Tuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H, infer I, infer J] ? [ResolveRecursiveInternal<A>, ResolveRecursiveInternal<B>, ResolveRecursiveInternal<C>, ResolveRecursiveInternal<D>, ResolveRecursiveInternal<E>, ResolveRecursiveInternal<F>, ResolveRecursiveInternal<G>, ResolveRecursiveInternal<H>, ResolveRecursiveInternal<I>, ResolveRecursiveInternal<J>, ...(ResolveRecursiveInternal<Additional>[])] :
		never

	// This is very crude
	type ResolveNot<ValueType> =
		// TODO: allow Not() for array/object types of specific schemas. Not easy.
		object | any[] |
		(ValueType extends NullSchema ? never : null) |
		(ValueType extends NumberSchema ? never : number) |
		(ValueType extends UndefinedSchema ? never : undefined) |
		(ValueType extends StringSchema ? never : string) |
		(ValueType extends BoolSchema ? never : boolean)

	type ResolveRecursiveInternal<SchemaType> =
		SchemaType extends SchemaDeclaration<null> ? null :
		SchemaType extends ConstSchema<infer Value> ? Value :
		SchemaType extends SchemaDeclaration<string> ? string :
		SchemaType extends SchemaDeclaration<boolean> ? boolean :
		SchemaType extends SchemaDeclaration<number> ? number :
		SchemaType extends Not<infer T> ? ResolveNot<T> :
		SchemaType extends ObjectSchema<infer Props, infer Required, infer Additional> ? ResolveObject<SchemaType, Props, Required, Additional> :
		SchemaType extends ArraySchema<infer ValueType> ? ResolveArray<ValueType> :
		SchemaType extends SchemaDeclaration<typeof undefined> ? undefined :
		never

	// TODO
	type ResolveOneOf<InnerSchema> = InnerSchema

	// High order resolution changes the schema before resolving it to typed
	type ResolveHighOrder<SchemaToResolve extends SchemaBase> =
		SchemaToResolve extends IfThenElseSchema<infer If, infer Then, infer Else> ? (If & Then) | Else :
		SchemaToResolve extends OneOf<infer Inner> ? ResolveOneOf<Inner> :
		SchemaToResolve extends AllOf<infer Inner> ? UnionToIntersection<Inner> :
		SchemaToResolve extends AnyOf<infer Inner> ? Inner :
		SchemaToResolve

	type ResolveRecursive<SchemaType> =
		SchemaType extends TupleSchema<infer TupleType, infer Additional> ? (Additional extends null ? AsTypedTupleSchema<TupleType> : AsTypedTupleSchemaWithAdditional<TupleType, Additional>) :
		ResolveRecursiveInternal<ResolveHighOrder<SchemaType>>

	type MapPropsToRefs<Props, Definitions extends DefinitionsBase> =
		Definitions extends { [name: string]: SchemaBase } ? { [name in keyof Props]: ResolveRefs<Props[name], Definitions> } : never

	type ResolveIfThenElseRefs<ITEType extends IfThenElseSchema<If, Then, Else>, If extends SchemaBase, Then extends SchemaBase, Else extends SchemaBase, Definitions extends DefinitionsBase> =
		SchemaBase & { If: ResolveRefs<If, Definitions>, Then: ResolveRefs<Then, Definitions>, Else: ResolveRefs<Else, Definitions> }

	type ResolveArrayRefs<ArrayType extends ArraySchema<ValueType>, ValueType extends SchemaBase, Definitions extends DefinitionsBase> =
		SchemaDeclaration<any[]> & { items: ResolveRefs<ValueType, Definitions> }

	type ResolveTupleRefs<TupleType extends TupleSchema<Tuple, Additional>, Tuple extends SchemaBase[], Additional extends SchemaBase, Definitions extends DefinitionsBase> =
		SchemaDeclaration<any[]> & { items: ResolveRefs<Tuple, Definitions>, additionalItems: ResolveRefs<Additional, Definitions> }

	type ResolveCombinerRefs<CombinerType extends CombinerSchema<ValueType, Operator>, ValueType extends SchemaBase, Operator extends string, Definitions extends DefinitionsBase> =
		{ [name in Operator]: ResolveRefs<ValueType, Definitions>[] }

	type ResolveOperatorRefs<OperatorType extends OperatorSchema<ValueType, Operator>, ValueType extends SchemaBase, Operator extends string, Definitions extends DefinitionsBase> =
		{ [name in Operator]: ResolveRefs<ValueType, Definitions> }

	type ResolveDefinitions<Definitions extends DefinitionsBase> =
		{ [DefinitionName in keyof Definitions]: ResolveRefs<Definitions[DefinitionName], Definitions> }

	type ExtractDefinitionsById<Definitions extends DefinitionsBase> = {
		[key in X<Definitions>]: Definitions[keyof Definitions]
	}
	type X<D extends DefinitionsBase> = D[keyof D]['$id'] extends string ? string : never


	type ResolveRefs<SchemaToResolve, Definitions extends DefinitionsBase> =
		SchemaToResolve extends RefSchema<infer RefId> ? Definitions[RefId] :
		SchemaToResolve extends ObjectSchema<infer Props, infer Required> ? ObjectSchema<MapPropsToRefs<Props, Definitions>, Required> :
		SchemaToResolve extends TupleSchema<infer Tuple, infer Additional> ? (Tuple extends SchemaBase[] ? ResolveTupleRefs<SchemaToResolve, Tuple, Additional, Definitions> : never) :
		SchemaToResolve extends ArraySchema<infer ValueType> ? ResolveArrayRefs<SchemaToResolve, ValueType, Definitions> :
		SchemaToResolve extends CombinerSchema<infer ValueType, infer Operator> ? ResolveCombinerRefs<SchemaToResolve, ValueType, Operator, Definitions> :
		SchemaToResolve extends OperatorSchema<infer ValueType, infer Operator> ? ResolveOperatorRefs<SchemaToResolve, ValueType, Operator, Definitions> :
		SchemaToResolve extends IfThenElseSchema<infer If, infer Then, infer Else> ? ResolveIfThenElseRefs<SchemaToResolve, If, Then, Else, Definitions> :
		SchemaToResolve

	type ResolveRootSchemaDefinitions<Schema> = Schema extends SchemaWithDefinitions<infer D> ? ResolveDefinitions<ExtractDefinitionsById<D>> : {}
	type ResolveRefsForRootSchema<RootSchema> = ResolveRefs<RootSchema, ResolveRootSchemaDefinitions<RootSchema>>

	export type ResolveRootSchema<RootSchema> = ResolveRecursive<ResolveRefsForRootSchema<RootSchema>>

	export type AsTyped<Schema> = JSONSchema.ResolveRootSchema<Schema>


	/* // Tests
		// should be valid
		const myNumber: AsTyped<{ type: 'number' }> = 1 // number
		const myString: AsTyped<{ type: 'string' }> = 'hello' // string
		const myBool: AsTyped<{ type: 'boolean' }> = true // boolean
		const myNull: AsTyped<{ type: 'null' }> = null // null
		const undef: AsTyped<{ type: 'undefined' }> = undefined // undefined
		const directRef: AsTyped<{ definitions: { num: { $id: 'def', type: 'number' } }, $ref: 'def' }> = 1 // number
		const recursiveRef: AsTyped<{ definitions: { str1: { $id: 'def', $ref: 'def2' }, str2: { $id: 'def2', type: 'string' } }, $ref: 'def' }> = '1' // string
		const arrayOfNumbers: AsTyped<{ type: 'array', items: { type: 'number' } }> = [1, 2, 3] // number[]
		const arrayOfStrings: AsTyped<{ type: 'array', items: { type: 'string' } }> = ['1', '2', '3'] // string[]
		const arrayOfBool: AsTyped<{ type: 'array', items: { type: 'boolean' } }> = [true, false] // boolean[]
		const arrayOfArraysOfStrings: AsTyped<{ type: 'array', items: { type: 'array', items: { type: 'string' } } }> = [['1', '2']] // string[][]
		const objectOfBool: AsTyped<{ type: 'object', properties: { b: { type: 'boolean' } } }> = { b: true } // {b?: boolean}
		const objectWithNumberAndString: AsTyped<{ type: 'object', properties: { a: { type: 'number' }, b: { type: 'string' } } }> = { a: 3, b: '1' } // {a?: number, b?: string}
		const objectOfAnyNumbers: AsTyped<{ type: 'object', additionalProperties: { type: 'number' } }> = { xfg: 3, dhi: 1 } // {[name: string]: number}
		const reqProps: AsTyped<{ type: 'object', properties: { a: { type: 'number' }, b: { type: 'string' } }, required: ['a'] }> = { a: 3, b: '5' } // {a: number, b?: string}
		const not: AsTyped<{ not: { type: 'number' } }> = '1'
		const not2: AsTyped<{ not: { type: 'string' } }> = { a: '1' }
		const oneOf: AsTyped<{ oneOf: [{ type: 'string' }, { type: 'number' }] }> = 1 // string | number
		const oneOfObject: AsTyped<{ oneOf: [{ type: 'string' }, { type: 'object', properties: { a: { type: 'number' } } }] }> = { a: 1 } // string | {a: number}
		const allOf: AsTyped<{ allOf: [{ type: 'object', properties: { a: { type: 'number' } } }, { type: 'object', properties: { b: { type: 'string' } } }] }> = { a: 1, b: 'str' } // {a: number} & {b: string}
		const tuple: AsTyped<{ type: 'array', items: [{ type: 'number' }, { type: 'string' }] }> = [1, '123'] // [number, string]
		const tupleWithAdditional: AsTyped<{ type: 'array', items: [{ type: 'number' }, { type: 'string' }], additionalItems: { type: 'string' } }> = [1, '123', 'abc'] // [number, string, ...string[]]
		const tupleWithAdditionalObject: AsTyped<{ type: 'array', items: [{ type: 'number' }, { type: 'string' }], additionalItems: { type: 'object', properties: { bla: { type: 'string' } } } }> = [1, '123', { bla: 'abc' }] // [number, string, ...{bla: string}[]]
		const recursiveObject: AsTyped<{ type: 'object', properties: { arr: { type: 'array', items: { type: 'object', additionalProperties: { type: 'string' } } } } }> = { arr: [{ somthing: '1' }] } // {arr: {[name: string]: string}[]}
		const IfThenElse1: AsTyped<{ If: { type: 'object', properties: { a: { type: 'number' } } }, Then: { type: 'object', properties: { b: { type: 'string' } } }, Else: { type: 'object', properties: { c: { type: 'array', items: { type: 'string' } } } } }> = { a: '1', b: '2' }
		const WithConst: AsTyped<{ type: 'object', properties: { a: { type: 'string', const: '123' } } }> = { a: '123' }
		const withEnum: AsTyped<{ type: 'string', enum: ['123', '456'] }> = '123'
	
		// should be invalid
		const numberAndString: AsTyped<{ type: 'number' }> = '123' // number
		const stringAndNumber: AsTyped<{ type: 'string' }> = 123 // string
		const propsAndAdditional: AsTyped<{ type: 'object', properties: { a: { type: 'number' } } }> = { a: 1, b: '123', c: 3 } // {a?: number}
		const MissingReqProps: AsTyped<{ type: 'object', properties: { a: { type: 'number' }, b: { type: 'string' } }, required: ['a'] }> = { b: '3' } // {a: number, b?: string}
		const notBad: AsTyped<{ not: { type: 'number' } }> = 1 // anything but number
		const oneOfBad: AsTyped<{ oneOf: [{ type: 'string' }, { type: 'number' }] }> = {} // string|number
		const oneOfObjectBad: AsTyped<{ oneOf: [{ type: 'string' }, { type: 'object', properties: { a: { type: 'number' } } }] }> = { a: '123' } // string | {a: number}
		const withEnumBad: AsTyped<{ type: 'string', enum: ['123', '456'] }> = '789'
		const withConstBad: AsTyped<{ type: 'string', const: '123' }> = '789'
	
		// TODO: Should be invalid but currently pass
		const oneOfWithAllOf: AsTyped<{ oneOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'object', properties: { b: { type: 'number' } } }] }> = { a: '123', b: 3 } // string|number
		const IfThenElseBad: AsTyped<{ If: { type: 'object', properties: { a: { type: 'number' } } }, Then: { type: 'object', properties: { b: { type: 'string' } } }, Else: { type: 'object', properties: { c: { type: 'array', items: { type: 'string' } } } } }> = { a: '1', b: '2', c: ['3'] }
	*/
}


export type CodeCheckResult1 = JSONSchema.AsTyped<{
	"$schema": "http://json-schema.org/draft-07/schema#",
	"$id": "http://danfortsystems.com/schemas/code-check-result.json",
	"type": "object",
	"properties": {
		"name": {
			"type": "string"
		},
		"message": {
			"type": "string"
		},
		"description": {
			"type": "string"
		},
		"counts": {
			"properties": {
				"failure": {
					"type": "number"
				},
				"success": {
					"type": "number"
				},
				"warning": {
					"type": "number"
				}
			},
			"required": [
				"failure"
			],
			"type": "object"
		},
		"byFile": {
			"type": "object",
			"additionalProperties": {
				"type": "object",
				"required": [
					"counts",
					"details"
				],
				"properties": {
					"message": {
						"type": "string"
					},
					"description": {
						"type": "string"
					},
					"counts": {
						"properties": {
							"failure": {
								"type": "number"
							},
							"success": {
								"type": "number"
							},
							"warning": {
								"type": "number"
							}
						},
						"required": [
							"failure"
						],
						"type": "object"
					},
					"details": {
						"type": "array",
						"items": {
							"type": "object",
							"properties": {
								"Id": {
									"type": "string"
								},
								"message": {
									"type": "string"
								},
								"description": {
									"type": "string"
								},
								"category": {
									"type": "string",
									"enum": [
										"success",
										"warning",
										"failure"
									]
								},
								"startLine": {
									"type": "integer"
								},
								"startColumn": {
									"type": "integer"
								},
								"endLine": {
									"type": "integer"
								},
								"endColumn": {
									"type": "integer"
								}
							},
							"required": [
								"message",
								"category"
							]
						}
					}
				}
			}
		}
	},
	"required": [
		"byFile",
		"counts",
		"name"
	]
}>

