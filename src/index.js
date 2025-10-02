#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import ivm from 'isolated-vm';
import fetch from 'node-fetch';

// CSV/TSV Parser Function
function parseCSVToJSON(text, delimiter = ',') {
  let lines = text.trim().split('\n');
  
  // Skip non-data lines (headers, separators, etc.)
  lines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.startsWith('Sheet:') && 
           !trimmed.match(/^[\-\+\|\s]+$/) && // Skip separator lines like "---+---+---"
           trimmed.split(delimiter).length > 1; // Must have at least 2 columns
  });
  
  if (lines.length < 2) {
    throw new Error('CSV/TSV file must have at least a header row and one data row');
  }
  
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
    const row = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Try to convert to appropriate type
      if (value === '') {
        row[header] = null;
      } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
        // Check if it's an integer
        if (value.includes('.') || value.includes(',')) {
          row[header] = parseFloat(value.replace(',', '.'));
        } else {
          row[header] = parseInt(value, 10);
        }
      } else if (value.toLowerCase() === 'true') {
        row[header] = true;
      } else if (value.toLowerCase() === 'false') {
        row[header] = false;
      } else {
        row[header] = value;
      }
    });
    
    data.push(row);
  }
  
  return data;
}

// Smart delimiter detection based on content analysis
function detectDelimiter(text) {
  // Skip header lines like "Sheet: ..."
  const lines = text.split('\n').filter(line => 
    !line.trim().startsWith('Sheet:') && 
    !line.match(/^[\-\+\|\s]+$/) &&
    line.trim().length > 0
  );
  
  if (lines.length === 0) return ',';
  
  const firstDataLine = lines[0];
  
  // Count occurrences of potential delimiters
  const tabCount = (firstDataLine.match(/\t/g) || []).length;
  const commaCount = (firstDataLine.match(/,/g) || []).length;
  const semicolonCount = (firstDataLine.match(/;/g) || []).length;
  const pipeCount = (firstDataLine.match(/\|/g) || []).length;
  
  // Choose delimiter with highest count
  if (pipeCount > tabCount && pipeCount > commaCount && pipeCount > semicolonCount) {
    return '|';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    return '\t';
  } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
    return ';';
  } else {
    return ',';
  }
}

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
        description: 'Execute JavaScript code with data from a URL or inline JSON/CSV/TSV. Supports both expressions and complex statements with variables and return statements. Automatically detects format (JSON, CSV, TSV) from URL or content. Use "data" variable to access the parsed data. Examples: Simple expression: "data.length", Complex code: "const filtered = data.filter(x => x.value > 10); return filtered.length"',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to fetch JSON/CSV/TSV data from (optional if data is provided)',
            },
            data: {
              type: 'object',
              description: 'Inline JSON data (optional if URL is provided)',
            },
            code: {
              type: 'string',
              description: 'JavaScript code to execute. The variable "data" contains your parsed data (JSON array for CSV/TSV). Can be a simple expression like "data.length" or complex code with variables and return statements like "const result = data.filter(x => x.id > 5); return result.length"',
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
      const text = await response.text();
      
      // Detect format by content analysis (no file extensions!)
      try {
        // Try JSON first (retrocompatibility)
        data = JSON.parse(text);
      } catch (jsonError) {
        // If JSON fails, try CSV/TSV based on content analysis
        try {
          // Auto-detect delimiter by analyzing content
          const delimiter = detectDelimiter(text);
          data = parseCSVToJSON(text, delimiter);
        } catch (csvError) {
          // If both fail, throw JSON error for clarity
          throw new Error(`Unable to parse data. JSON error: ${jsonError.message}. CSV/TSV error: ${csvError.message}`);
        }
      }
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