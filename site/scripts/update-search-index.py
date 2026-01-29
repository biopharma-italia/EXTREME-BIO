#!/usr/bin/env python3
"""
Updates the search index with all physicians from physicians-complete.json
"""

import json
from pathlib import Path
from datetime import datetime

def main():
    script_dir = Path(__file__).parent
    site_dir = script_dir.parent
    
    # Load physicians
    physicians_file = site_dir / 'data' / 'entities' / 'physicians-complete.json'
    with open(physicians_file, 'r', encoding='utf-8') as f:
        physicians_data = json.load(f)
    
    # Load current index
    index_file = site_dir / 'data' / 'search' / 'index.json'
    with open(index_file, 'r', encoding='utf-8') as f:
        index_data = json.load(f)
    
    specialties_map = physicians_data['specialties']
    physicians = physicians_data['physicians']
    
    # Update index with all physicians
    terms = index_data.get('terms', {})
    
    for p in physicians:
        # Add physician by full name
        name_lower = p['name'].lower()
        spec_id = p['specialty_id']
        spec_name = specialties_map.get(spec_id, {}).get('name', spec_id.title())
        
        # Create search entry for this physician
        physician_entry = {
            'physicians': [p['slug']],
            'specialties': [spec_id],
            'priority': f"physician:{p['slug']}"
        }
        
        # Add procedures if available
        if p.get('procedures'):
            physician_entry['procedures'] = p['procedures']
        
        # Add pathways if available
        if p.get('pathways'):
            physician_entry['pathways'] = p['pathways']
        
        # Add by full name
        terms[name_lower] = physician_entry
        
        # Add by last name only
        name_parts = p['name'].split()
        if len(name_parts) > 1:
            last_name = name_parts[-1].lower()
            if last_name not in terms:
                terms[last_name] = physician_entry.copy()
            elif 'physicians' in terms[last_name]:
                if p['slug'] not in terms[last_name]['physicians']:
                    terms[last_name]['physicians'].append(p['slug'])
            else:
                terms[last_name]['physicians'] = [p['slug']]
        
        # Add by job title (if unique enough)
        job_lower = p['job_title'].lower()
        if job_lower not in terms:
            terms[job_lower] = {
                'physicians': [p['slug']],
                'specialties': [spec_id],
                'priority': f"specialty:{spec_id}"
            }
        elif 'physicians' in terms[job_lower]:
            if p['slug'] not in terms[job_lower]['physicians']:
                terms[job_lower]['physicians'].append(p['slug'])
    
    # Update specialty entries with all their physicians
    for spec_id, spec_info in specialties_map.items():
        spec_physicians = [p['slug'] for p in physicians if p['specialty_id'] == spec_id]
        if spec_physicians:
            spec_name_lower = spec_info.get('name', spec_id).lower()
            
            # Add/update by specialty name
            if spec_name_lower in terms:
                terms[spec_name_lower]['physicians'] = spec_physicians
            else:
                terms[spec_name_lower] = {
                    'physicians': spec_physicians,
                    'specialties': [spec_id],
                    'priority': f"specialty:{spec_id}"
                }
            
            # Add/update by specialty ID
            if spec_id in terms:
                terms[spec_id]['physicians'] = spec_physicians
            else:
                terms[spec_id] = {
                    'physicians': spec_physicians,
                    'specialties': [spec_id],
                    'priority': f"specialty:{spec_id}"
                }
    
    # Update stats
    index_data['terms'] = terms
    index_data['stats']['total_terms'] = len(terms)
    index_data['stats']['physicians'] = len(physicians)
    index_data['generated'] = datetime.now().isoformat()
    index_data['version'] = '2.1.0'
    
    # Save updated index
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    
    # Update version file
    version_file = site_dir / 'data' / 'cache' / 'version.json'
    version_data = {
        'version': '2.1.0',
        'updated': datetime.now().isoformat(),
        'physicians': len(physicians),
        'specialties': len([s for s in specialties_map if any(p['specialty_id'] == s for p in physicians)]),
        'terms': len(terms)
    }
    with open(version_file, 'w', encoding='utf-8') as f:
        json.dump(version_data, f, ensure_ascii=False, indent=2)
    
    print(f"Updated search index with {len(physicians)} physicians")
    print(f"Total search terms: {len(terms)}")
    print(f"Index version: 2.1.0")

if __name__ == '__main__':
    main()
