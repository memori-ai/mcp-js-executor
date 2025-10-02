# MCP JavaScript Executor

Secure MCP server that executes JavaScript code for data analysis with support for multiple data formats using isolated-vm.

## 🚀 Features

- ✅ **Multi-format Data Support**: JSON, CSV, TSV, and pipe-separated data
- ✅ **Smart Format Detection**: Automatically detects data format from content (not file extension)
- ✅ **Secure Execution**: Isolated JavaScript environment with resource limits
- ✅ **Flexible Data Input**: Support for URLs and inline data
- ✅ **Advanced JavaScript**: Variables, functions, return statements, and complex logic
- ✅ **Safety Limits**: 5-second timeout and 128MB memory protection

## 📊 Supported Data Formats

### JSON
```json
[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]
```

### CSV (Comma-separated)
```csv
name,age,city
John,30,New York
Jane,25,Boston
```

### TSV (Tab-separated)
```tsv
name	age	city
John	30	New York
Jane	25	Boston
```

### Pipe-separated
```
name|age|city
John|30|New York
Jane|25|Boston
```

**Note**: The MCP automatically detects the format and delimiter from the content, converting all tabular data into JavaScript arrays of objects.

## Installation
```bash
npx mcp-js-executor
```

## 🔧 Usage Examples

### Simple Data Analysis
```javascript
// Count total records
data.length

// Filter and count active items
data.filter(item => item.status === 'active').length

// Find maximum value
Math.max(...data.map(item => item.price))
```

### Complex Data Processing
```javascript
// Sales analysis by month
const salesByMonth = {};
data.forEach(sale => {
  const month = sale.Mese;
  salesByMonth[month] = (salesByMonth[month] || 0) + sale['Totale Vendita'];
});
return Object.entries(salesByMonth).map(([month, total]) => ({month, total}));
```

### Advanced Analytics
```javascript
// Find top performers with statistics
const sellers = {};
data.filter(o => o.Mese === 'agosto').forEach(o => {
  sellers[o.Venditore] = (sellers[o.Venditore] || 0) + 1;
});
return Object.entries(sellers)
  .map(([name, count]) => ({name, orders: count}))
  .sort((a,b) => b.orders - a.orders);
```

## 🌐 MCP Tool Call Format

### Using URL Data Source
```json
{
  "tool": "execute_js",
  "parameters": {
    "url": "https://example.com/data.csv",
    "code": "data.filter(item => item.status === 'active').length"
  }
}
```

### Using Inline Data
```json
{
  "tool": "execute_js", 
  "parameters": {
    "data": [{"name": "John", "age": 30}],
    "code": "data.filter(person => person.age > 25).length"
  }
}
```

## 🔄 Data Conversion Process

1. **Format Detection**: Analyzes content to identify delimiter (`,`, `\t`, `;`, `|`)
2. **Smart Parsing**: Skips header lines and separator rows automatically
3. **Type Conversion**: Converts strings to numbers/booleans when appropriate
4. **Object Creation**: Transforms rows into JavaScript objects with column headers as keys

### Example Conversion
**Input CSV:**
```
name,age,active
John,30,true
Jane,25,false
```

**Becomes JavaScript:**
```javascript
[
  {"name": "John", "age": 30, "active": true},
  {"name": "Jane", "age": 25, "active": false}
]
```