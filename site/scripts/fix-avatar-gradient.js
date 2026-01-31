const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');

// Fix pink avatars (ginecology pages)
const pinkFix = (content) => {
    return content.replace(
        /style="background-color: #E91E63">\s*(\w{2})\s*<\/div>/g,
        'style="background: linear-gradient(135deg, #f472b6 0%, #E91E63 100%);">$1</div>'
    );
};

// Fix red avatars (cardiology pages)
const redFix = (content) => {
    return content.replace(
        /style="background-color: #E53935">\s*(\w{2})\s*<\/div>/g,
        'style="background: linear-gradient(135deg, #ef5350 0%, #E53935 100%);">$1</div>'
    );
};

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let fixedCount = 0;
files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    content = pinkFix(content);
    content = redFix(content);
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
    }
});

console.log(`\n📊 Total files fixed: ${fixedCount}`);
