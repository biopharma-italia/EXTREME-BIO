# Matrice Decisionale Prestazioni — 2026-08-20

Fonti: GIPO 12m (fatturato reale) × GSC 90gg (25.000 coppie query→pagina) × inventario sito.

**Esito: 0 CREATE · 14 UPGRADE · 2 MERGE · 4 HOLD**

| Prestazione | €/12m | Decisione | URL azione | Evidenza |
|---|---|---|---|---|
| Visita + eco ginecologica | €289,538 | **UPGRADE** | `/ginecologia/` | Query 'ginecologo sassari' (3k impr) vinte dalla HOME pos 2.5, hub /ginecologia/ solo pos 15.5 su 'ginecologo'. Hub debole vs home: potenziare hub con prezzi/medici/CTA senza toccare home. NO nuova pagina (cannibalizzazione). |
| Prima visita ginecologica | €146,222 | **MERGE** | `/ginecologia/` | Stesso cluster query della riga sopra: un'unica azione sul hub copre entrambe (€435k/anno aggregati). |
| Visita dermatologica | €83,323 | **UPGRADE** | `/dermatologia/visita-dermatologica/` | Sottopagina esiste ma 285 impr pos 13.5; hub raccoglie il 49% (12.2k impr pos 9.7). Potenziare sottopagina + link dal hub. |
| Visita medico sportiva | €41,430 | **UPGRADE** | `/visita-medicina-sport/` | 1.776 impr pos 6.6 — striking distance. 813 prestazioni/anno. Prezzo+prenotazione+FAQ certificati. |
| Visita oculistica | €42,200 | **UPGRADE** | `/oculistica/visita-oculistica/` | Sottopagina quasi invisibile (230 impr pos 27.6) mentre hub fa 89% share pos 8.6. Sottopagina da rifare o consolidare nel hub. |
| Endocrino + eco tiroide | €34,670 | **UPGRADE** | `/endocrinologia/ecografia-tiroidea/` | Pagina INVISIBILE in GSC (0 impr 90gg) nonostante 233 prestazioni/anno. Riscrivere. checkup-tiroide invece già forte (10k impr pos 8.8): non toccare. |
| Pap test | €33,976 | **MERGE** | `/ginecologia/hpv-dna-test/ (canonico)` | 3 pagine si sovrappongono: hpv-dna-test (1.707 impr pos 6.4), /ginecologia/pap-test-hpv/ (134), /salute/pap-test-hpv/ + duopap. Consolidare su hpv-dna-test, redirect/canonical dalle altre. |
| Prima visita otorino | €30,726 | **UPGRADE** | `/otorinolaringoiatria/visita-orl/` | Sottopagina 321 impr pos 17 vs hub 54% share pos 9.2. Potenziare sottopagina (fibrolaringoscopia €204 di scontrino medio). |
| Visita cardiologica eco+ecg | €28,148 | **UPGRADE** | `/cardiologia/visita-cardiologica-ecg/` | 258 impr pos 10.1; cluster cardio inquinato da legacy /pages/*.html (2.1k impr pos 52, già 301 ma Google li rimostra). Potenziare sottopagina, richiedere rimozione legacy da indice. |
| Visita reumatologica | €28,040 | **UPGRADE** | `/reumatologia/visita-reumatologica/` | 1.512 impr pos 7.6 — striking distance, 36% share cluster. Piccolo boost = top 5. |
| Visita ematologica | €22,100 | **UPGRADE** | `/ematologia/visita-ematologica/` | Sottopagina 143 impr pos 15.9; il 32% del cluster lo prende il profilo equipe di Podda (521 click!). Sottopagina da potenziare + interlink profilo. |
| Ecografia addome completo | €18,820 | **UPGRADE** | `/gastroenterologia/ecografia-addominale/` | 811 impr pos 10.5, 86% share. A un passo dalla pagina 1 alta. |
| Visita endocrinologica | €16,485 | **HOLD** | `/endocrinologia/` | Hub già pos 8.6 con 46% share; l'azione su eco-tiroidea e checkup copre il cluster. Rivalutare a +14gg. |
| Mappatura nei | €16,095 | **UPGRADE** | `/dermatologia/mappatura-nevi/` | 616 impr pos 12.1 con 19 click. Query 'mappatura nei sassari' pos 3.2. Boost = presidio totale. |
| Visita gastroenterologica | €14,275 | **HOLD** | `/gastroenterologia/` | Hub fortissimo: 80% share pos 7.7. Sottopagina non prioritaria. Rivalutare dopo. |
| Visita nefrologica + eco | €13,800 | **UPGRADE** | `/visita-nefrologica/` | 1.932 impr pos 6.4 — striking distance. 27% share al profilo equipe: interlink. |
| Visita ortopedica | €13,545 | **UPGRADE** | `/ortopedia/` | Hub 74% share ma pos 15.4 (pagina 2!): 5.2k impr in palio. Upgrade hub, sottopagina segue. |
| Visita urologica | €12,000 | **UPGRADE** | `/urologia/` | 3.007 impr pos 7.0 (fix regex: no contaminazione neurologia). Sottopagina debole (205 impr pos 15.9). |
| Visita neurologica | €10,000 | **HOLD** | `/neurologia/` | Già forte: hub pos 8.3 78% share; elettromiografia pos 4.0 con 60 click. Non toccare ciò che vince. |
| Visita pneumologica | €9,000 | **HOLD** | `/pneumologia/` | Fatturato minore, hub pos 11.3. In coda dopo i risultati della prima ondata. |

## Fatturato per tipo di azione
- UPGRADE: €674,435/anno
- MERGE: €180,198/anno
- HOLD: €49,760/anno

## Scoperta collaterale
- Fantasmi legacy `/pages/*.html`: ~12k impression a pos 45-65 con **0 click** (redirect 301 già attivi ma Google li rimostra). Inquinano i cluster cardio/orto/uro/gineco.

_Generato dal motore Revenue-First. Prossimo refresh: +14gg post fase-1._