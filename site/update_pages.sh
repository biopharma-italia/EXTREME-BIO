#!/bin/bash

# Pagine in pages/ (usano ../css/ e ../js/)
for file in pages/*.html; do
  # Aggiungi search.css se non presente
  if ! grep -q "search.css" "$file"; then
    sed -i 's|<link rel="stylesheet" href="../css/style.css">|<link rel="stylesheet" href="../css/style.css">\n  <link rel="stylesheet" href="../css/search.css">|g' "$file"
  fi
  
  # Aggiungi search.js e header-search.js prima di </body>
  if ! grep -q "search.js" "$file"; then
    sed -i 's|</body>|  <script src="../js/search.js"></script>\n  <script src="../js/header-search.js"></script>\n</body>|g' "$file"
  fi
done

# Pagine in prestazioni/ (usano ../css/ e ../js/)
for file in prestazioni/*.html; do
  if ! grep -q "search.css" "$file"; then
    sed -i 's|<link rel="stylesheet" href="../css/style.css">|<link rel="stylesheet" href="../css/style.css">\n  <link rel="stylesheet" href="../css/search.css">|g' "$file"
  fi
  
  if ! grep -q "search.js" "$file"; then
    sed -i 's|</body>|  <script src="../js/search.js"></script>\n  <script src="../js/header-search.js"></script>\n</body>|g' "$file"
  fi
done

# Pagine in equipe/ singole medici (usano ../css/ e ../js/)
for file in equipe/*.html; do
  if [ "$file" != "equipe/index.html" ]; then
    if ! grep -q "search.css" "$file"; then
      sed -i 's|<link rel="stylesheet" href="../css/style.css">|<link rel="stylesheet" href="../css/style.css">\n  <link rel="stylesheet" href="../css/search.css">|g' "$file"
    fi
    
    if ! grep -q "search.js" "$file"; then
      sed -i 's|</body>|  <script src="../js/search.js"></script>\n  <script src="../js/header-search.js"></script>\n</body>|g' "$file"
    fi
  fi
done

echo "Pagine aggiornate!"
