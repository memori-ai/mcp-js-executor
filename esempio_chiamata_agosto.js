// Esempio di chiamata MCP per "Quanti ordini sono stati fatti ad agosto?"

const chiamataMCP = {
  "tool": "execute_js",
  "parameters": {
    "url": "file:///Users/nunziofiore/Downloads/ID%20Vendita%20Data%20Mese%20Trimestre%20Venditore.tsv",
    "code": `
      // Il TSV viene automaticamente convertito in array di oggetti
      console.log("Primi 3 record per debug:", data.slice(0, 3));
      
      // Filtra ordini di agosto (il campo Mese contiene "agosto")
      const ordiniAgosto = data.filter(ordine => ordine.Mese === 'agosto');
      
      // Statistiche dettagliate
      const fatturateAgosto = ordiniAgosto.reduce((sum, ordine) => 
        sum + ordine['Totale Vendita'], 0
      );
      
      const ticketMedio = fatturateAgosto / ordiniAgosto.length;
      
      // Analisi per venditore in agosto
      const venditori = {};
      ordiniAgosto.forEach(ordine => {
        const venditore = ordine.Venditore;
        if (!venditori[venditore]) {
          venditori[venditore] = { ordini: 0, fatturato: 0 };
        }
        venditori[venditore].ordini++;
        venditori[venditore].fatturato += ordine['Totale Vendita'];
      });
      
      const topVenditoreAgosto = Object.entries(venditori)
        .map(([nome, stats]) => ({ nome, ...stats }))
        .sort((a, b) => b.ordini - a.ordini)[0];
      
      return {
        ordiniTotaliAgosto: ordiniAgosto.length,
        fatturatoTotale: fatturateAgosto,
        ticketMedio: ticketMedio,
        topVenditore: topVenditoreAgosto,
        dettaglioVenditori: Object.entries(venditori)
          .map(([nome, stats]) => ({ nome, ...stats }))
          .sort((a, b) => b.ordini - a.ordini)
      };
    `
  }
};

// Risposta attesa (esempio):
const rispostaAttesa = {
  "ordiniTotaliAgosto": 85,  // Numero esatto dal tuo dataset
  "fatturatoTotale": 234567.89,
  "ticketMedio": 2759.62,
  "topVenditore": {
    "nome": "Marco Rossi",
    "ordini": 12,
    "fatturato": 25430.50
  },
  "dettaglioVenditori": [
    { "nome": "Marco Rossi", "ordini": 12, "fatturato": 25430.50 },
    { "nome": "Giulia Costa", "ordini": 11, "fatturato": 23890.25 },
    // ... altri venditori
  ]
};

export { chiamataMCP, rispostaAttesa };
