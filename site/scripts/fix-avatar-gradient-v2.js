const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');

// Define gradient mappings for different colors
const colorGradients = {
    '#E91E63': { from: '#f472b6', to: '#E91E63' },  // Pink (gyneco)
    '#E53935': { from: '#ef5350', to: '#E53935' },  // Red (cardio)
    '#0288D1': { from: '#4fc3f7', to: '#0288D1' },  // Blue (oculistica)
    '#00796B': { from: '#4db6ac', to: '#00796B' },  // Teal
    '#7B1FA2': { from: '#ba68c8', to: '#7B1FA2' },  // Purple
    '#F57C00': { from: '#ffb74d', to: '#F57C00' },  // Orange
    '#388E3C': { from: '#81c784', to: '#388E3C' },  // Green
    '#1976D2': { from: '#64b5f6', to: '#1976D2' },  // Blue darker
    '#5D4037': { from: '#a1887f', to: '#5D4037' },  // Brown
    '#455A64': { from: '#90a4ae', to: '#455A64' },  // Blue gray
    '#C2185B': { from: '#f48fb1', to: '#C2185B' },  // Pink darker
    '#D32F2F': { from: '#e57373', to: '#D32F2F' },  // Red alt
    '#303F9F': { from: '#7986cb', to: '#303F9F' },  // Indigo
    '#512DA8': { from: '#9575cd', to: '#512DA8' },  // Deep purple
    '#689F38': { from: '#aed581', to: '#689F38' },  // Light green
    '#FBC02D': { from: '#fff176', to: '#FBC02D' },  // Yellow
    '#00704A': { from: '#4db6ac', to: '#00704A' },  // Bio green
};

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let fixedCount = 0;
files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace background-color with gradient for known colors
    Object.entries(colorGradients).forEach(([color, gradient]) => {
        const escapedColor = color.replace('#', '\\#');
        // Match avatars with initials (2-3 letters)
        const regex = new RegExp(
            `(w-16 h-16 rounded-full[^>]*?)style="background-color: ${escapedColor}"([^>]*>\\s*)(\\w{2,3})(\\s*</div>)`,
            'g'
        );
        content = content.replace(regex, 
            `$1style="background: linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%);"$2$3$4`
        );
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
    }
});

console.log(`\n📊 Total files fixed: ${fixedCount}`);
