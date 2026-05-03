const fs = require('fs');

// Prende la chiave API di ScrapingRobot
const API_KEY = process.env.SCRAPING_ROBOT_KEY; 

async function runTracker() {
    let data = { domains: [] };
    if (fs.existsSync('data.json')) {
        data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    } else {
        data.domains.push({
            name: "tuosito.it",
            keywords: ["parola chiave 1"],
            history: []
        });
    }

    const today = new Date().toISOString().split('T')[0];

    for (let domain of data.domains) {
        for (let kw of domain.keywords) {
            console.log(`Controllo: "${kw}" per ${domain.name}`);
            
            let rank = ">100";
            let foundUrl = "N/A";

            try {
                // Costruiamo l'URL esatto di Google, forzando 100 risultati e lingua/paese italiano
                const googleSearchUrl = `https://www.google.it/search?q=${encodeURIComponent(kw)}&num=100&hl=it&gl=it`;

                const response = await fetch(`https://api.scrapingrobot.com/?token=${API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: googleSearchUrl,
                        module: "GoogleSearchScraper" // Usiamo il modulo specifico per Google
                    })
                });

                const resultData = await response.json();

                // ScrapingRobot restituisce i risultati nell'array 'organicResults'
                if (resultData && resultData.result && resultData.result.organicResults) {
                    const results = resultData.result.organicResults;
                    
                    // Cerchiamo il dominio (ScrapingRobot restituisce 'url' invece di 'link')
                    const matchIndex = results.findIndex(res => res.url && res.url.includes(domain.name));
                    
                    if (matchIndex !== -1) {
                        // L'indice dell'array parte da 0, la posizione da 1
                        rank = matchIndex + 1;
                        foundUrl = results[matchIndex].url;
                        console.log(`Trovato a posizione ${rank}!`);
                    } else {
                        console.log(`Non trovato nei primi risultati analizzati.`);
                    }
                } else {
                    console.log("Risultati organici non trovati nella risposta di ScrapingRobot.");
                    if(resultData.error) console.error("Errore API:", resultData.error);
                }

            } catch (error) {
                console.error(`Errore di rete su "${kw}":`, error.message);
            }
            
            domain.history.push({ date: today, keyword: kw, position: rank, url: foundUrl });
            
            // Pausa per essere gentili con l'API
            await new Promise(r => setTimeout(r, 1500)); 
        }
    }

    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    console.log("Dati aggiornati e salvati in data.json");
}

runTracker();
