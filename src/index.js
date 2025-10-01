#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import ivm from 'isolated-vm';
import fetch from 'node-fetch';

const server = new Server(
  {
    name: 'mcp-js-executor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'execute_js',
        description: 'Execute JavaScript code with data from a URL or inline JSON. Supports both expressions and complex statements with variables and return statements. Use "data" variable to access the JSON data. Examples: Simple expression: "data.length", Complex code: "const filtered = data.filter(x => x.value > 10); return filtered.length"',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to fetch JSON data from (optional if data is provided)',
            },
            data: {
              type: 'object',
              description: 'Inline JSON data (optional if URL is provided)',
            },
            code: {
              type: 'string',
              description: 'JavaScript code to execute. The variable "data" contains your JSON. Can be a simple expression like "data.length" or complex code with variables and return statements like "const result = data.filter(x => x.id > 5); return result.length"',
            },
          },
          required: ['code'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'execute_js') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { url, data: inlineData, code } = request.params.arguments;

  try {
    // Fetch data from URL if provided
    let data = inlineData;
    if (url && !data) {
      const response = await fetch(url);
      data = await response.json();
    }

    if (!data) {
      throw new Error('Either url or data must be provided');
    }

    // Create isolated VM
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = await isolate.createContext();

    // Transfer data into the isolate
    const jail = context.global;
    await jail.set('global', jail.derefInto());
    
    const dataRef = await jail.set('data', new ivm.ExternalCopy(data).copyInto());

    // Execute code with timeout
    let result;
    let output;
    
    try {
      // Try as expression first (backward compatibility)
      const expressionScript = await isolate.compileScript(`(${code})`);
      result = await expressionScript.run(context, { timeout: 5000, copy: true });
      output = result;
    } catch (expressionError) {
      try {
        // If expression fails, try as statement/function
        let codeToExecute;
        
        // If code doesn't include return, wrap it and return the last expression
        if (!code.includes('return')) {
          // For single expressions or assignments, just evaluate and return the last expression
          const lines = code.split(';').map(line => line.trim()).filter(line => line);
          const lastLine = lines[lines.length - 1];
          
          // If last line looks like an assignment or declaration, create a return statement
          if (lines.length > 1 && (lastLine.includes('=') || lastLine.startsWith('const ') || lastLine.startsWith('let ') || lastLine.startsWith('var '))) {
            codeToExecute = `${code}; undefined`;
          } else {
            // Single expression or return the result of the last expression
            const allButLast = lines.slice(0, -1).join('; ');
            codeToExecute = `${allButLast ? allButLast + '; ' : ''}${lastLine}`;
          }
        } else {
          // Code already has return, define a function and call it
          codeToExecute = `(function() { ${code} })()`;
        }
        
        const statementScript = await isolate.compileScript(codeToExecute);
        result = await statementScript.run(context, { timeout: 5000, copy: true });
        output = result;
      } catch (statementError) {
        // If both fail, throw the original expression error for clarity
        throw expressionError;
      }
    }
    isolate.dispose();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(output, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP JavaScript Executor started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});