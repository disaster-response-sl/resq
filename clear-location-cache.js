// Clear Location Cache Script
// Run this in the browser console if location shows incorrectly

// Clear all location cache
const keys = Object.keys(localStorage);
keys.forEach(key => {
  if (key.startsWith('location_')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});

console.log('✅ Location cache cleared!');
console.log('🔄 Refreshing page...');

// Reload the page
setTimeout(() => {
  window.location.reload();
}, 1000);
