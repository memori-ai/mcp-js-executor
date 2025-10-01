# MCP JavaScript Executor

Secure MCP server that executes JavaScript code for data analysis using isolated-vm.

## Features

- ✅ Execute both simple expressions and complex JavaScript statements
- ✅ Support for variables, functions, and return statements  
- ✅ Secure isolated execution environment
- ✅ JSON data input from URLs or inline
- ✅ 5-second execution timeout protection
- ✅ Memory limit protection (128MB)

## Installation
```bash
npx mcp-js-executor
```

## Usage Examples

### Simple Expressions
```javascript
// Count items
data.length

// Filter and count
data.filter(item => item.status === 'active').length
```

### Complex Statements
```javascript
// Multiple operations with variables
const activeItems = data.filter(item => item.status === 'active');
const total = activeItems.reduce((sum, item) => sum + item.value, 0);
return { count: activeItems.length, total: total };
```

### With Return Statements
```javascript
const filtered = data.filter(x => x.date >= '2025-09-01');
return {
  count: filtered.length,
  average: filtered.length > 0 ? filtered.reduce((s, x) => s + x.amount, 0) / filtered.length : 0
};
```