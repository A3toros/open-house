/**
 * Simple test file for enhanced TokenManager event system
 * Run this in the browser console to test the new functionality
 */

console.log('🧪 Testing Enhanced TokenManager Event System...');

// Test event registration
console.log('1. Testing event registration...');
window.tokenManager.on('tokenChange', (data) => {
  console.log('✅ tokenChange event received:', data);
});

window.tokenManager.on('roleChange', (data) => {
  console.log('✅ roleChange event received:', data);
});

window.tokenManager.on('refresh', (data) => {
  console.log('✅ refresh event received:', data);
});

window.tokenManager.on('logout', (data) => {
  console.log('✅ logout event received:', data);
});

window.tokenManager.on('error', (data) => {
  console.log('✅ error event received:', data);
});

// Test event listener counts
console.log('2. Testing event listener counts...');
const counts = window.tokenManager.getEventListenerCounts();
console.log('Event listener counts:', counts);

// Test debug method
console.log('3. Testing debug method...');
window.tokenManager.debug();

// Test token setting (if not already set)
console.log('4. Testing token setting...');
if (!window.tokenManager.isAuthenticated()) {
  console.log('Setting test tokens...');
  const success = window.tokenManager.setTokens('test_token', 'student');
  console.log('Token setting result:', success);
} else {
  console.log('Already authenticated, testing role change...');
  // Test role change by setting the same role (should not trigger roleChange event)
  window.tokenManager.setTokens(window.tokenManager.getAccessToken(), window.tokenManager.getUserRole());
}

console.log('🧪 TokenManager Event System Test Complete!');
console.log('Check the console for event emissions and debug information.');

