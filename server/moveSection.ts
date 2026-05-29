import fs from 'fs';

function moveSection() {
  const file = 'c:/Users/82106/safety-inspection-app/src/components/Dashboard.tsx';
  let content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  // Find boundaries
  const kpiEnd = lines.findIndex(l => l.includes('      </div>')) + 1; // Not reliable enough, let's find exact lines
  
  const dDayStartIdx = lines.findIndex(l => l.includes('{/* Left Col: D-Day List */}')) - 1; // -1 for the wrapping div `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`
  
  const floorPlanStartIdx = lines.findIndex(l => l.includes('{/* Floor Plan Viewer */}'));
  const modalStartIdx = lines.findIndex(l => l.includes('{/* Equipment List Modal */}'));
  
  if (floorPlanStartIdx === -1 || modalStartIdx === -1) {
    console.error('Could not find Floor Plan or Modal section');
    return;
  }
  
  // The floor plan block is from floorPlanStartIdx to modalStartIdx - 1
  const floorPlanBlock = lines.slice(floorPlanStartIdx, modalStartIdx);
  
  // Remove floor plan block from original array
  lines.splice(floorPlanStartIdx, modalStartIdx - floorPlanStartIdx);
  
  // Find where to insert (before D-Day list wrapping div)
  const insertIdx = lines.findIndex(l => l.includes('<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">'));
  
  if (insertIdx === -1) {
    console.error('Could not find insert index');
    return;
  }
  
  // Insert floor plan block at insertIdx
  lines.splice(insertIdx, 0, ...floorPlanBlock);
  
  fs.writeFileSync(file, lines.join('\n'));
  console.log('Successfully moved Floor Plan Viewer');
}

moveSection();
