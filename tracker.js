name: SEO Rank Tracker Cron

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  track-seo:
    runs-on: ubuntu-latest
    steps:
      - name: Clona il repository
        uses: actions/checkout@v3

      - name: Installa Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Esegui lo script Tracker
        env:
          SCRAPING_ROBOT_KEY: ${{ secrets.SCRAPING_ROBOT_KEY }}
        run: node tracker.js

      - name: Salva i nuovi dati (Commit e Push)
        run: |
          git config --global user.name "SEO Tracker Bot"
          git config --global user.email "bot@tuodominio.com"
          git add data.json
          git commit -m "Aggiornamento posizioni SEO" || echo "Nessuna modifica"
          git push
