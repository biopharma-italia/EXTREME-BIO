# Bio-Clinic Development Policy

## URL Standard
- **Clean URLs**: All public URLs use trailing slash format: `/cardiologia/`, `/equipe/nome/`
- **No .html**: Public URLs never expose `.html` extension
- **Root-relative**: All internal links must be root-relative: `/path/`, not `../path/`

## Link Rules
1. **Always use root-relative paths**: `href="/cardiologia/"` NOT `href="cardiologia.html"`
2. **Hub pages**: Link to `/specialty/` (with trailing slash)
3. **Service pages**: Link to `/service-name/` (rewritten to `/pages/service-name.html`)
4. **Team pages**: Link to `/equipe/name/` (rewritten to `/equipe/name.html`)

## Pre-Deploy Checklist
- [ ] Run `./scripts/pre-deploy-validation.sh`
- [ ] All links root-relative
- [ ] All canonicals use clean URLs (no .html)
- [ ] Sitemap updated
- [ ] _redirects includes new pages

## File Structure
```
/site/
├── index.html              # Homepage
├── sitemap.xml             # All clean URLs
├── _redirects              # Cloudflare Pages rewrite rules
├── cardiologia/
│   ├── index.html          # Hub page
│   └── service/index.html  # Service pages
├── pages/
│   └── *.html              # Legacy service pages (served via rewrite)
├── equipe/
│   └── *.html              # Team profiles (served via rewrite)
```

## Adding New Pages
1. Create HTML file
2. Add canonical: `<link rel="canonical" href="https://bio-clinic.it/path/">`
3. Add to sitemap.xml
4. Add rewrite rule to _redirects (if in /pages/ or /equipe/)
5. Run validation script

## Forbidden Patterns
- ❌ `href="page.html"` (plain relative)
- ❌ `href="../page.html"` (parent relative)
- ❌ Canonical with .html extension
- ❌ Links to /pages/ directory
