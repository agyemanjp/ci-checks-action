const OFF = 0, WARN = 1, ERROR = 2;

module.exports = {
	"parser": "@typescript-eslint/parser",
	"plugins": ["@typescript-eslint", "fp"],
	"env": { "browser": true, "node": true },
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"rules": {
		/* typescript */
		"@typescript-eslint/member-delimiter-style": ["off", {
			"multiline": {
				"delimiter": "semi",
				"requireLast": false
			},
			"singleline": {
				"delimiter": "semi",
				"requireLast": false
			}
		}],

		/* functional */
		"fp/no-arguments": "warn",
		//"fp/no-class": "warn",
		"fp/no-delete": "warn",
		"fp/no-events": "warn",
		"fp/no-get-set": "warn",
		"fp/no-let": "warn",
		"fp/no-loops": "warn",
		"fp/no-mutating-assign": "warn",
		"fp/no-mutating-methods": "warn",
		"fp/no-mutation": "warn",
		//"fp/no-nil": "warn",
		"fp/no-proxy": "warn",
		"fp/no-rest-parameters": "warn",
		//"fp/no-this": "warn",
		//"fp/no-throw": "warn",
		//"fp/no-unused-expression": "warn",
		"fp/no-valueof-field": "warn",

		/* general */
		"no-var": "warn",
		"no-console": "off",
		//"no-unused-vars": "error",
		"no-unused-expressions": "error",
		"no-unused-labels": "error",
		"no-await-in-loop": "error",
		"no-irregular-whitespace": "error",
		"no-unexpected-multiline": "error",
		"no-template-curly-in-string": "error",
		"no-unsafe-negation": "error",
		"require-atomic-updates": "error",
		"no-import-assign": "error",
		"no-unreachable": "error",
		"init-declarations": ["error", "always"],
		"no-shadow": "error",
		"no-undef-init": "off",

		/* code style */
		"semi": ["error", "never"],
		"brace-style": ["error", "stroustrup"],
		"camelcase": ["error", { "properties": "always", "ignoreImports": true }],
		"block-spacing": ["error", "always"],
		//"indent": ["warn", "tab"]
	}
}