# MCP JavaScript Executor - Guida Pratica per Agenti AI

## 🎯 COSA FA QUESTO TOOL

`execute_js` esegue codice JavaScript su dati **JSON, CSV o TSV** in modo sicuro. Rileva automaticamente il formato e converte tutto in array di oggetti JavaScript.

## 🔧 COME CHIAMARE L'MCP CORRETTAMENTE

### ✅ FORMATO CORRETTO
```javascript
{
  "tool": "execute_js",
  "parameters": {
    "url": "https://example.com/data.csv", 
    "code": "data.filter(item => item.status === 'active').length"
  }
}
```

### ❌ FORMATO SBAGLIATO (NON FARE MAI!)
```javascript
// ❌ SBAGLIATO - parameters come stringa
{
  "tool": "execute_js", 
  "parameters": "{\"url\": \"...\", \"code\": \"...\"}"
}

// ❌ SBAGLIATO - virgolette non escaped
{
  "tool": "execute_js",
  "parameters": "{ "url": "...", "code": "..." }"
}
```

## 🚨 REGOLE CRITICHE PER AGENTI

### 1. PARAMETRI SEMPRE COME OGGETTO
- `parameters` deve essere un **oggetto JavaScript**
- MAI passare `parameters` come **stringa JSON**
- Le virgolette interne devono essere correttamente escaped

### 2. CODICE IN UNA SINGOLA RIGA
- Il campo `code` deve essere una **stringa unica**
- Rimuovi **tutti i newline** (`\n`) dal codice
- Usa `;` per separare le istruzioni

### 3. ESEMPI FUNZIONANTI

**Contare record:**
```javascript
{
  "tool": "execute_js",
  "parameters": {
    "url": "https://data.example.com/sales.csv",
    "code": "data.length"
  }
}
```

**Filtrare per mese:**
```javascript
{
  "tool": "execute_js", 
  "parameters": {
    "url": "https://data.example.com/sales.csv",
    "code": "data.filter(item => item.Mese === 'agosto').length"
  }
}
```

**Analisi complessa (UNA RIGA):**
```javascript
{
  "tool": "execute_js",
  "parameters": {
    "url": "https://data.example.com/sales.csv", 
    "code": "const ordiniAgosto = data.filter(o => o.Mese === 'agosto'); const venditori = {}; ordiniAgosto.forEach(o => { venditori[o.Venditore] = (venditori[o.Venditore] || 0) + 1; }); return Object.entries(venditori).map(([nome, count]) => ({nome, ordini: count})).sort((a,b) => b.ordini - a.ordini);"
  }
}
```

## 🗂️ FORMATI SUPPORTATI

- **JSON**: Array o oggetti → accesso diretto
- **CSV**: `campo1,campo2,campo3` → array di oggetti  
- **TSV**: `campo1\tcampo2\tcampo3` → array di oggetti
- **Pipe-separated**: `campo1|campo2|campo3` → array di oggetti

**Il tool rileva automaticamente il formato dal contenuto!**

## 📊 PATTERN JAVASCRIPT ROBUSTI

### 1. Template Base (Sempre da usare)
```javascript
"if (data.length === 0) return {error: 'Nessun dato'}; const filtered = data.filter(item => /* condizioni */); if (filtered.length === 0) return {error: 'Nessun risultato'}; return {result: /* elaborazione */, count: filtered.length};"
```

### 2. Raggruppamento per Campo
```javascript
"const groups = {}; data.forEach(item => { const key = item.categoria; groups[key] = (groups[key] || 0) + 1; }); return Object.entries(groups).map(([cat, count]) => ({categoria: cat, count})).sort((a,b) => b.count - a.count);"
```

### 3. Top N con Controlli
```javascript
"if (data.length === 0) return {error: 'Nessun dato'}; const sorted = data.sort((a,b) => b.valore - a.valore); return {top5: sorted.slice(0,5), total: data.length};"
```

### 4. Analisi Temporale
```javascript
"const mesi = {}; data.forEach(item => { const mese = item.data.substring(5,7); mesi[mese] = (mesi[mese] || 0) + item.importo; }); return Object.entries(mesi).map(([mese, totale]) => ({mese, totale})).sort((a,b) => a.mese.localeCompare(b.mese));"
```

## 🎯 ESEMPI PRATICI VENDITE

### Dataset Vendite con Pipe (|)
```
ID Vendita|Data|Mese|Venditore|Totale Vendita
V001|15/08/2024|agosto|Marco|1250.50
V002|16/08/2024|agosto|Giulia|890.25
```

**Query Esempi:**

**1. Ordini per mese:**
```javascript
{
  "tool": "execute_js",
  "parameters": {
    "url": "https://your-data-url.com/vendite.txt",
    "code": "const conteggi = {}; data.forEach(v => { conteggi[v.Mese] = (conteggi[v.Mese] || 0) + 1; }); return Object.entries(conteggi).map(([mese, count]) => ({mese, ordini: count})).sort((a,b) => b.ordini - a.ordini);"
  }
}
```

**2. Top venditori agosto:**
```javascript
{
  "tool": "execute_js",
  "parameters": {
    "url": "https://your-data-url.com/vendite.txt", 
    "code": "const agosto = data.filter(v => v.Mese === 'agosto'); const venditori = {}; agosto.forEach(v => { const nome = v.Venditore; venditori[nome] = {ordini: (venditori[nome]?.ordini || 0) + 1, fatturato: (venditori[nome]?.fatturato || 0) + v['Totale Vendita']}; }); return Object.entries(venditori).map(([nome, stats]) => ({venditore: nome, ...stats})).sort((a,b) => b.fatturato - a.fatturato);"
  }
}
```

**3. Statistiche mensili:**
```javascript
{
  "tool": "execute_js",
  "parameters": {
    "url": "https://your-data-url.com/vendite.txt",
    "code": "const mesi = {}; data.forEach(v => { const m = v.Mese; if (!mesi[m]) mesi[m] = {ordini: 0, fatturato: 0}; mesi[m].ordini++; mesi[m].fatturato += v['Totale Vendita']; }); return Object.entries(mesi).map(([mese, stats]) => ({mese, ...stats, ticketMedio: stats.fatturato/stats.ordini})).sort((a,b) => b.fatturato - a.fatturato);"
  }
}
```

## ✅ CHECKLIST PRE-CHIAMATA

Prima di chiamare l'MCP, verifica:

- [ ] `parameters` è un **oggetto**, non una stringa
- [ ] `code` è una **singola riga** senza `\n`
- [ ] Hai **controlli per dati vuoti** all'inizio
- [ ] **Restituisci oggetti** strutturati, non valori singoli
- [ ] Usi **nomi campo corretti** (con spazi: `item['Campo Nome']`)
- [ ] Hai **gestito valori null/undefined**

## 🔧 TROUBLESHOOTING

### Errore: "Cannot parse JSON"
- **Causa**: `parameters` passato come stringa invece di oggetto
- **Soluzione**: Rimuovi virgolette esterne da `parameters`

### Risultato: "0" quando dovrebbe essere > 0  
- **Causa**: Nome campo sbagliato o valori non corrispondenti
- **Soluzione**: Usa debug code prima: `Object.keys(data[0])`

### Errore: "Timeout" 
- **Causa**: Codice troppo complesso o dataset troppo grande
- **Soluzione**: Semplifica logica, aggiungi `slice(0, 1000)` ai dati

### Errore: "Cannot read property"
- **Causa**: Campo non esiste o dati vuoti
- **Soluzione**: Aggiungi controlli: `if (data.length === 0)` e `item.field || ''`

## ⚠️ LIMITI TECNICI

- **Timeout**: 5 secondi massimo per esecuzione
- **Memoria**: 128MB massimo
- **Sicurezza**: Ambiente isolato, no filesystem/network
- **Variabili**: Solo `data` disponibile (contiene i dati parsed)

---

**🚀 Usa sempre questo formato e i pattern robusti per analisi dati perfette!**
