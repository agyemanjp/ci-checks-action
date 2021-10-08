# ci-checks-action
Create Github annotated checks from script output files

## Description
Create Github checks (with annotations for pull request diffs) from the output (in a [standardized JSON format](https://gist.githubusercontent.com/agyemanjp/0f43de0639a7ec872e9ebcbe6166d5d9/raw/ccb90a9298561f2ba7c07ba6843b2b25244f9cf7/code-check-general.schema.json)) of custom code check scripts. The annotations include a summary of errors and warnings, including links to the line numbers of any errors or warnings. It works on both pull requests (only on changed files) and pushes.

## Rationale
This action allows for more flexibility in implementing code checks. Instead on bundling specific checks, it allows you to use any custom script, as long as it outputs its results to a local JSON file in the proper format.

## Usage Example
In `.github/workflows/nodejs.yml`:

```yml
name: Example Workflow

on: [pull_request]

jobs:
  checks:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [12.x]

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2
        with: 
          persist-credentials: false

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node-version }}
        
      - name: Install
        run: npm ci --no-audit --prefer-offline 

      - name: Build
        run: npm run compile --if-present

      - name: Lint
        run: npm run lint
        continue-on-error: true
        
      - name: Test
        run: npm run test
        continue-on-error: true
        
      - name: Annotate Checks
        uses: agyemanjp/ci-checks-action@2.1.1
        with:
          ghToken: ${{ secrets.GITHUB_TOKEN }}
          checks: '[
              {
                "name": "lint",
                "fileName": ".lint.run.json",
                "prChangesOnly": true
              },
              {
                "name": "test",
                "fileName": ".test.run.json",
                "prChangesOnly": false
              }
            ]'
```
