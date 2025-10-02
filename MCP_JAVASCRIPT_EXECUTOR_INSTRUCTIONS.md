# MCP JavaScript Executor - Istruzioni Complete

## 🎯 DESCRIZIONE TOOL

`execute_js` è un tool MCP che esegue codice JavaScript in modo sicuro su dati JSON, CSV e TSV per analisi e manipolazione dati. Supporta sia espressioni semplici che codice complesso con variabili e funzioni.

## 🔧 MODALITÀ DI INPUT

### Modalità 1: Dati JSON da URL
```javascript
{
  "url": "https://api.example.com/data.json",
  "code": "data.filter(item => item.value > 100).length"
}
```

### Modalità 2: Dati CSV/TSV da URL
```javascript
{
  "url": "https://example.com/sales.csv",
  "code": "data.filter(item => item.amount > 1000).length"
}
```

### Modalità 3: Dati Inline (JSON)
```javascript
{
  "data": {
    "items": [
      {"id": 1, "value": 150, "category": "A"},
      {"id": 2, "value": 75, "category": "B"}
    ]
  },
  "code": "data.items.filter(item => item.value > 100).length"
}
```

### Priorità Input
1. Se presente `data` inline → usa quello (deve essere JSON)
2. Se presente solo `url` → scarica e rileva formato automaticamente
3. Se entrambi → usa `data` inline (ignora URL)
4. Se nessuno → errore

## 📋 PARAMETRI SCHEMA

```javascript
{
  "url": "string (opzionale)",        // URL per dati JSON/CSV/TSV
  "data": "object (opzionale)",       // Dati JSON inline  
  "code": "string (obbligatorio)"     // Codice JavaScript
}
```

**REGOLA**: Almeno uno tra `url` o `data` deve essere presente.

## 🗂️ SUPPORTO FORMATI

### JSON (.json)
- Standard supportato dall'inizio
- Accesso diretto tramite variabile `data`

### CSV (.csv) 
- Separatore: virgola (`,`)
- Convertito automaticamente in array di oggetti
- Headers diventano chiavi degli oggetti

### TSV (.tsv/.txt)
- Separatore: tab (`\t`)  
- Convertito automaticamente in array di oggetti
- Headers diventano chiavi degli oggetti

### Auto-Detection
- Rileva formato da estensione file (.json, .csv, .tsv)
- Rileva formato da Content-Type header
- Fallback: prova JSON, poi CSV/TSV con auto-detect delimiter

## 🚀 ESEMPI PRATICI CON DIVERSI FORMATI

### Esempio 1: Analisi Dataset Vendite TSV
```javascript
{
  "url": "https://example.com/vendite.tsv",
  "code": `
    // Il TSV viene convertito automaticamente in array di oggetti
    const venditeFiltrte = data.filter(v => v['Totale Vendita'] > 1000);
    const fatturato = venditeFiltrte.reduce((sum, v) => sum + v['Totale Vendita'], 0);
    
    return {
      ordiniAlti: venditeFiltrte.length,
      fatturatoTotale: fatturato,
      ticketMedio: fatturato / venditeFiltrte.length
    };
  `
}
```

### Esempio 2: Analisi per Venditore
```javascript
{
  "url": "https://example.com/vendite.tsv", 
  "code": `
    const venditori = {};
    
    data.forEach(vendita => {
      const nome = vendita.Venditore;
      if (!venditori[nome]) {
        venditori[nome] = { vendite: 0, fatturato: 0 };
      }
      venditori[nome].vendite++;
      venditori[nome].fatturato += vendita['Totale Vendita'];
    });
    
    const classifica = Object.entries(venditori)
      .map(([nome, stats]) => ({
        venditore: nome,
        vendite: stats.vendite,
        fatturato: stats.fatturato,
        ticketMedio: stats.fatturato / stats.vendite
      }))
      .sort((a, b) => b.fatturato - a.fatturato);
    
    return {
      topVenditore: classifica[0],
      classifica: classifica.slice(0, 5)
    };
  `
}
```

### Esempio 3: Analisi Temporale
```javascript
{
  "url": "https://example.com/vendite.tsv",
  "code": `
    const mesi = {};
    
    data.forEach(vendita => {
      const mese = vendita.Mese;
      if (!mesi[mese]) {
        mesi[mese] = { ordini: 0, fatturato: 0 };
      }
      mesi[mese].ordini++;
      mesi[mese].fatturato += vendita['Totale Vendita'];
    });
    
    const analisiMensile = Object.entries(mesi)
      .map(([mese, dati]) => ({
        mese,
        ordini: dati.ordini,
        fatturato: dati.fatturato,
        ticketMedio: dati.fatturato / dati.ordini
      }))
      .sort((a, b) => b.fatturato - a.fatturato);
    
    return {
      miglioreMese: analisiMensile[0],
      analisiCompleta: analisiMensile
    };
  `
}
```

## 🚀 TIPI DI CODICE SUPPORTATI

### 1. Espressioni Semplici
```javascript
"data.length"                           // Conta elementi
"data.filter(x => x.price > 50)"        // Filtra array
"data.reduce((s, x) => s + x.value, 0)" // Somma valori
```

### 2. Codice con Variabili (senza return)
```javascript
const filtered = data.filter(x => x.active);
const total = filtered.reduce((s, x) => s + x.amount, 0);
total / filtered.length  // Ultima espressione viene restituita
```

### 3. Codice con Return Esplicito
```javascript
const result = data.filter(x => x.status === 'active');
return {
  count: result.length,
  total: result.reduce((s, x) => s + x.value, 0)
};
```

## 🛡️ LIMITAZIONI SICUREZZA

- **Ambiente isolato**: No accesso filesystem, network, globals Node.js
- **Timeout**: 5 secondi massimo
- **Memoria**: 128MB massimo
- **Variabile disponibile**: Solo `data` contiene i dati JSON

## 📐 PATTERN JAVASCRIPT ROBUSTI

### 1. SEMPRE Controllare Array Vuoti
```javascript
if (data.length === 0) {
  return { error: "Nessun dato disponibile" };
}

const filtered = data.filter(/* criteri */);
if (filtered.length === 0) {
  return { error: "Nessun risultato trovato" };
}
```

### 2. Restituire Oggetti Strutturati
```javascript
// ❌ SBAGLIATO - Restituisce solo un valore
return data[0].name;

// ✅ CORRETTO - Oggetto strutturato
return {
  name: data[0].name,
  value: data[0].value,
  count: data.length
};
```

### 3. Aggregazioni per Gruppo (es. per cliente, categoria)
```javascript
// PATTERN STANDARD per raggruppamenti
const groups = {};

data.forEach(item => {
  const key = item.category; // Campo di raggruppamento
  if (!groups[key]) {
    groups[key] = {
      category: key,
      count: 0,
      total: 0,
      items: []
    };
  }
  groups[key].count++;
  groups[key].total += item.value;
  groups[key].items.push(item);
});

// Converti in array e ordina
const result = Object.values(groups)
  .sort((a, b) => b.total - a.total); // DESC per total

return {
  groups: result,
  totalGroups: result.length
};
```

### 4. Trovare Massimo/Minimo con Dettagli
```javascript
// PATTERN per "elemento con valore massimo"
const maxItem = data.reduce((max, current) => 
  current.value > max.value ? current : max
);

return {
  maxItem: maxItem,
  maxValue: maxItem.value,
  totalItems: data.length
};
```

### 5. Analisi Temporali (Date/Timestamp)
```javascript
// Per date in formato ISO (YYYY-MM-DD)
const periods = {};

data.forEach(item => {
  const period = item.date.substring(0, 7); // "2025-01" per mese
  if (!periods[period]) {
    periods[period] = { count: 0, total: 0 };
  }
  periods[period].count++;
  periods[period].total += item.value;
});

const periodArray = Object.entries(periods)
  .map(([period, stats]) => ({
    period,
    count: stats.count,
    total: stats.total,
    average: stats.total / stats.count
  }))
  .sort((a, b) => a.period.localeCompare(b.period)); // Ordine cronologico

return {
  periods: periodArray,
  bestPeriod: periodArray.reduce((max, p) => p.total > max.total ? p : max)
};
```

### 6. Statistiche Descrittive
```javascript
const values = data.map(item => item.value).filter(v => v != null);

if (values.length === 0) {
  return { error: "Nessun valore numerico valido" };
}

const sorted = values.sort((a, b) => a - b);
const sum = values.reduce((s, v) => s + v, 0);

return {
  count: values.length,
  sum: sum,
  average: sum / values.length,
  min: sorted[0],
  max: sorted[sorted.length - 1],
  median: sorted.length % 2 === 0 
    ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
    : sorted[Math.floor(sorted.length/2)]
};
```

### 7. Filtraggio Multiplo e Condizionale
```javascript
// Filtri multipli con contatori
const analysis = {
  total: data.length,
  highValue: data.filter(x => x.value > 1000).length,
  active: data.filter(x => x.status === 'active').length,
  recent: data.filter(x => x.date >= '2025-01-01').length
};

// Intersezioni
const highValueActive = data.filter(x => 
  x.value > 1000 && x.status === 'active'
).length;

return {
  ...analysis,
  highValueActive,
  percentageHighValue: (analysis.highValue / analysis.total * 100).toFixed(1)
};
```

### 8. Gestione Campi Null/Undefined
```javascript
// Controllo sicuro per campi opzionali
const validItems = data.filter(item => 
  item.value != null && 
  item.category && 
  item.date
);

// Accesso sicuro a proprietà annidate
const categories = data
  .filter(item => item.details && item.details.category)
  .map(item => item.details.category);

// Valori di default
const processedData = data.map(item => ({
  id: item.id,
  value: item.value || 0,
  category: item.category || 'Unknown',
  tags: item.tags || []
}));
```

## 📊 ESEMPI PRATICI PER DIVERSI DOMINI

### E-commerce
```javascript
// Analisi ordini
const orderAnalysis = {
  totalOrders: data.length,
  totalRevenue: data.reduce((s, o) => s + o.total, 0),
  avgOrderValue: data.reduce((s, o) => s + o.total, 0) / data.length,
  topCustomers: /* pattern raggruppamento per customer_id */
};
```

### Analytics/Metriche
```javascript
// Analisi eventi
const events = data.filter(e => e.event_type === 'conversion');
const conversionRate = (events.length / data.length * 100).toFixed(2);

return {
  totalEvents: data.length,
  conversions: events.length,
  conversionRate: `${conversionRate}%`
};
```

### Inventory/Catalogo
```javascript
// Analisi prodotti
const byCategory = /* pattern raggruppamento */;
const lowStock = data.filter(p => p.stock < p.reorder_level);

return {
  totalProducts: data.length,
  categories: Object.keys(byCategory).length,
  lowStockItems: lowStock.length,
  lowStockProducts: lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock }))
};
```

## ⚡ BEST PRACTICES

### 1. Performance
- Usa `filter()` prima di `map()` per ridurre iterazioni
- Evita loop annidati quando possibile
- Per grandi dataset, considera di limitare i risultati

### 2. Robustezza
- Controlla sempre `data.length === 0`
- Gestisci valori null/undefined
- Usa operatori safe (`?.` se supportato, altrimenti controlli manuali)

### 3. Leggibilità
- Usa nomi variabili descrittivi
- Commenta logica complessa
- Spezza operazioni complesse in step

### 4. Output
- Restituisci sempre oggetti strutturati
- Includi metadati utili (count, totals, percentages)
- Formatta numeri quando appropriato

## 🚨 ERRORI COMUNI DA EVITARE

### 1. Non controllare array vuoti
```javascript
// ❌ SBAGLIATO
return data[0].value; // Crash se data è vuoto

// ✅ CORRETTO  
if (data.length === 0) return { error: "No data" };
return data[0].value;
```

### 2. Non gestire null/undefined
```javascript
// ❌ SBAGLIATO
data.forEach(item => total += item.value); // Crash se value è null

// ✅ CORRETTO
data.forEach(item => {
  if (item.value != null) total += item.value;
});
```

### 3. Restituire tipi inconsistenti
```javascript
// ❌ SBAGLIATO - A volte string, a volte object
return data.length > 0 ? data[0].name : "No data";

// ✅ CORRETTO - Sempre object
return data.length > 0 
  ? { name: data[0].name, found: true }
  : { error: "No data", found: false };
```

### 4. Non ordinare risultati significativi
```javascript
// ❌ SBAGLIATO - Ordine casuale
return Object.values(groups);

// ✅ CORRETTO - Ordinato per relevanza
return Object.values(groups).sort((a, b) => b.total - a.total);
```

## 🎯 WORKFLOW CONSIGLIATO

1. **Analizza la richiesta**: Quali dati servono? Che tipo di aggregazione?
2. **Controlla input**: Array vuoto? Campi required presenti?
3. **Filtra**: Applica criteri se necessario
4. **Aggrega**: Usa pattern appropriati (raggruppamento, riduzione, etc.)
5. **Ordina**: Risultati per rilevanza
6. **Restituisci**: Oggetto strutturato con metadati

## 📝 TEMPLATE BASE

```javascript
// Controllo iniziale
if (!data || data.length === 0) {
  return { error: "Nessun dato disponibile", count: 0 };
}

// Filtraggio (se necessario)
const filtered = data.filter(item => /* criteri */);
if (filtered.length === 0) {
  return { error: "Nessun risultato con i criteri specificati", count: 0 };
}

// Elaborazione principale
const result = /* logica di business */;

// Output strutturato
return {
  result: result,
  metadata: {
    totalProcessed: data.length,
    totalFiltered: filtered.length,
    timestamp: new Date().toISOString()
  }
};
```

Usa questo tool per qualsiasi analisi o manipolazione di dati JSON in modo sicuro e performante!
