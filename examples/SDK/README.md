# Onhandl SDK Examples

This directory contains practical examples of how to use the Onhandl SDK in your applications.

## Prerequisites

- Node.js installed
- An Onhandl Developer API Key (Create one in the developer dashboard)
- A running Onhandl server

## Examples

1. **[Basic Usage](basic-usage.ts)**: Setting up the SDK and listing executions.
2. **[Execution Workflow](execution-workflow.ts)**: Starting and running an execution.
3. **[Node Simulation](simulate-node.ts)**: Testing individual nodes without a full execution.
4. **[Error Handling](error-handling.ts)**: How to catch and process `OnhandlSDKError`.

## How to Run

To run these examples, you can use `ts-node` or compile them with `tsc`.

```bash
# Set your API key
export ONHANDL_API_KEY="your_api_key_here"

# Run an example
npx ts-node execution-workflow.ts
```
