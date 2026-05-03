const fs = require('fs');

// Prende la chiave API di ScrapingRobot dai Secret di GitHub (NON INSERIRLA QUI DENTRO!)
const API_KEY = process.env.SCRAPING_ROBOT_KEY; 

async function runTracker() {
    let data = { domains: [] };
    if (fs.existsSync('data.json')) {
        data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    } else {
        // Inserisci qui i tuoi siti per la prima esecuzione
        data.domains.push({
            name: "tuosito.it",
            keywords: ["parola chiave 1"],
            history: []
        });
    }

    const today = new Date().toISOString().split('T')[0];
    const MAX_PAGES = 5; // Controlla le prime 5 pagine (Top 50). Aumentalo a 10 per la Top 100.

    for (let domain of data.domains) {
        for (let kw of domain.keywords) {
            console.log(`Controllo: "${kw}" per ${domain.name}`);
            
            let rank = ">" + (MAX_PAGES * 10);
            let foundUrl = "N/A";
            let found = false;

            // Sfogliamo le pagine di Google (0, 1, 2, 3...)
            for (let page = 0; page < MAX_PAGES; page++) {
                if (found) break; // Se lo abbiamo già trovato, smettiamo di consumare crediti

                let startParam = page * 10;
                
                try {
                    // Usiamo start=0, start=10, start=20...
                    const googleSearchUrl = `https://www.google.it/search?q=${encodeURIComponent(kw)}&hl=it&gl=it&start=${startParam}`;
                    console.log(`  -> Esploro pagina ${page + 1}...`);

                    const response = await fetch(`https://api.scrapingrobot.com/?token=${API_KEY}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            url: googleSearchUrl,
                            module: "GoogleSearchScraper"
                        })
                    });

                    const resultData = await response.json();

                    if (resultData && resultData.result && resultData.result.organicResults) {
                        const results = resultData.result.organicResults;
                        
                        const matchIndex = results.findIndex(res => res.url && res.url.includes(domain.name));
                        
                        if (matchIndex !== -1) {
                            // Calcolo posizione esatta: (pagina * 10) + indice risultato + 1
                            rank = startParam + matchIndex + 1;
                            foundUrl = results[matchIndex].url;
                            found = true;
                            console.log(`  Trovato a posizione ${rank}!`);
                        }
                    }

                } catch (error) {
                    console.error(`  Errore di rete su pagina ${page + 1}:`, error.message);
                }
                
                // Pausa obbligatoria per non sovraccaricare ScrapingRobot
                await new Promise(r => setTimeout(r, 2000)); 
            }
            
            domain.history.push({ date: today, keyword: kw, position: rank, url: foundUrl });
        }
    }

    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    console.log("Dati aggiornati e salvati in data.json");
}

runTracker();
