# Customizable CI Checks With Annotations

## Description

Create Github checks (with annotations) from custom ci scripts output (JSON) files. The annotations include a summary of errors and warnings, including links to the line numbers of the violations. Work on both pull requests (only on changed files) and pushes.


## Rationale

This actions allows for more flexibility in implementing ci checks. Instead on bundling the actual ci checks, it allows you to use any ci script, as long as it output its results to a local JSON file in the proper format.

## Usage Example

In `.github/workflows/nodejs.yml`:

```yml
name: Example Workflow

on: [pull_request]

jobs:
  checks:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2
        with: 
          persist-credentials: false

      - name: Setup Node.js 12.x
        uses: actions/setup-node@v1
        with:
          node-version: 12.x
      
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Checks
        run: npm run lint
        run: npm run test
        run: npm run benchmark
        # Continue to the next step even if this fails
        continue-on-error: true

      - name: Annotate Checks
        uses: prmph/ci-checks-action@1.0.0
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
		  # Paths for JSON file for each check, separate by semicolons (e.g. "lint:eslint.json; test:test_report.json")
          checks: "lint:eslint_report.json; test:mocha_test_report.json"
```
