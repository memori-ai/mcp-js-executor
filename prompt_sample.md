# MCP JavaScript Executor - Guida Pratica

## 🎯 COSA FA QUESTO TOOL

`execute_js` esegue codice JavaScript su dati **JSON, CSV o TSV** in modo sicuro. Rileva automaticamente il formato e converte tutto in array di oggetti JavaScript.

## 🔧 COME USARLO

### Con URL (Raccomandato)
```javascript
{
  "url": "https://example.com/data.json",     // Può essere .json, .csv, .tsv
  "code": "data.filter(item => item.value > 100).length"
}
```

### Con Dati Inline (Solo JSON)
```javascript
{
  "data": [{"id": 1, "value": 150}, {"id": 2, "value": 75}],
  "code": "data.filter(item => item.value > 100).length"
}
```

## 🗂️ FORMATI SUPPORTATI

- **JSON**: Array o oggetti → accesso diretto
- **CSV**: `campo1,campo2,campo3` → array di oggetti
- **TSV**: `campo1\tcampo2\tcampo3` → array di oggetti

Il tool **rileva automaticamente** il formato dal contenuto, non dall'estensione!

## ⚡ ESEMPI VELOCI

### Contare Record
```javascript
"data.length"
```

### Filtrare e Contare
```javascript
"data.filter(item => item.status === 'active').length"
```

### Sommare Valori
```javascript
"data.reduce((sum, item) => sum + item.amount, 0)"
```

### Analisi Complessa
```javascript
const filtered = data.filter(x => x.category === 'electronics');
const total = filtered.reduce((sum, x) => sum + x.price, 0);
return {
  count: filtered.length,
  total: total,
  average: total / filtered.length
};
```

## 📊 PATTERN ESSENZIALI

### 1. Sempre Controllare Dati Vuoti
```javascript
if (data.length === 0) {
  return { error: "Nessun dato disponibile" };
}
```

### 2. Raggruppare per Campo
```javascript
const groups = {};
data.forEach(item => {
  const key = item.category;
  if (!groups[key]) {
    groups[key] = { count: 0, total: 0 };
  }
  groups[key].count++;
  groups[key].total += item.value;
});

return Object.values(groups).sort((a, b) => b.total - a.total);
```

### 3. Top N Elementi
```javascript
const sorted = data.sort((a, b) => b.value - a.value);
return sorted.slice(0, 5); // Top 5
```

### 4. Analisi Temporale
```javascript
const byMonth = {};
data.forEach(item => {
  const month = item.date.substring(0, 7); // "2025-01"
  if (!byMonth[month]) byMonth[month] = 0;
  byMonth[month] += item.amount;
});

return Object.entries(byMonth)
  .map(([month, total]) => ({ month, total }))
  .sort((a, b) => a.month.localeCompare(b.month));
```

## 🚀 ESEMPI CON CSV/TSV

### Dataset Vendite (TSV)
```
ID Vendita	Data	Venditore	Totale Vendita
V001	2025-08-15	Marco	1250.50
V002	2025-08-16	Giulia	890.25
```

**Codice JavaScript:**
```javascript
// Ordini di agosto
const agosto = data.filter(v => v.Data.includes('2025-08'));

// Per venditore
const venditori = {};
data.forEach(v => {
  const nome = v.Venditore;
  if (!venditori[nome]) {
    venditori[nome] = { vendite: 0, fatturato: 0 };
  }
  venditori[nome].vendite++;
  venditori[nome].fatturato += v['Totale Vendita'];
});

return {
  ordiniAgosto: agosto.length,
  topVenditore: Object.entries(venditori)
    .map(([nome, stats]) => ({ nome, ...stats }))
    .sort((a, b) => b.fatturato - a.fatturato)[0]
};
```

## 🎯 REGOLE D'ORO

### ✅ FAI SEMPRE
- Controlla `data.length === 0` all'inizio
- Restituisci oggetti strutturati: `{ result: x, count: y }`
- Usa nomi campo corretti (con spazi usa `item['Campo Nome']`)
- Ordina risultati per rilevanza

### ❌ NON FARE MAI
- `return data[0].field` senza controlli
- Assumere che i campi esistano sempre
- Restituire solo numeri/stringhe (usa oggetti)
- Ignorare valori null/undefined

## 📝 TEMPLATE UNIVERSALE

```javascript
// 1. Controllo base
if (data.length === 0) {
  return { error: "Nessun dato", count: 0 };
}

// 2. Filtraggio (se serve)
const filtered = data.filter(item => /* condizioni */);

// 3. Elaborazione
const result = /* la tua logica */;

// 4. Output strutturato
return {
  result: result,
  count: filtered.length || data.length,
  total: data.length
};
```

## 🔄 CONVERSIONE AUTOMATICA CSV/TSV

**Input CSV:**
```
name,age,city
Mario,30,Roma
Giulia,25,Milano
```

**Diventa JavaScript:**
```javascript
[
  { name: "Mario", age: 30, city: "Roma" },
  { name: "Giulia", age: 25, city: "Milano" }
]
```

**Accesso ai dati:**
```javascript
data.filter(person => person.age > 25)           // Filtra per età
data.map(person => person.city)                  // Lista città
data.reduce((sum, p) => sum + p.age, 0)          // Somma età
```

## ⚠️ SICUREZZA E LIMITI

- **Timeout**: 5 secondi massimo
- **Memoria**: 128MB massimo  
- **Isolamento**: No filesystem, no network, no Node.js globals
- **Solo dati**: Accesso limitato alla variabile `data`

---

**Usa questo tool per analizzare qualsiasi dataset JSON, CSV o TSV in modo veloce e sicuro!** 🚀
