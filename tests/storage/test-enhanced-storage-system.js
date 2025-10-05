/**
 * Enhanced Storage System Test
 * Tests file upload with 2MB size limit, metadata storage, and admin file management
 */

const TEST_CONFIG = {
  API_BASE: 'http://localhost:3000/api',
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ADMIN_EMAIL: 'admin@example.com',
  TEST_USER_ID: 'test-user-123',
};

// Test file creation utilities
function createTestFile(name, sizeInBytes, type = 'image/jpeg') {
  const content = new Array(sizeInBytes).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

function createLargeTestFile(name, sizeInMB = 3) {
  return createTestFile(name, sizeInMB * 1024 * 1024);
}

function createValidTestFile(name, sizeInKB = 500) {
  return createTestFile(name, sizeInKB * 1024);
}

// Test suite for file upload validation
async function testFileUploadValidation() {
  console.log('🧪 Testing File Upload Validation...');

  const tests = [
    {
      name: 'Valid file upload (500KB)',
      file: createValidTestFile('valid-receipt.jpg', 500),
      category: 'receipt',
      expected: 'success',
    },
    {
      name: 'File too large (3MB)',
      file: createLargeTestFile('large-receipt.jpg', 3),
      category: 'receipt',
      expected: 'error',
      expectedStatus: 413,
    },
    {
      name: 'Invalid file type',
      file: createTestFile('document.exe', 1024, 'application/x-executable'),
      category: 'receipt',
      expected: 'error',
      expectedStatus: 415,
    },
    {
      name: 'Missing category',
      file: createValidTestFile('test.jpg'),
      category: '',
      expected: 'error',
      expectedStatus: 400,
    },
    {
      name: 'Invalid category',
      file: createValidTestFile('test.jpg'),
      category: 'invalid',
      expected: 'error',
      expectedStatus: 400,
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`  Testing: ${test.name}`);

      const formData = new FormData();
      formData.append('file', test.file);
      formData.append('category', test.category);
      formData.append('userId', TEST_CONFIG.TEST_USER_ID);

      const response = await fetch(`${TEST_CONFIG.API_BASE}/storage/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-email': TEST_CONFIG.ADMIN_EMAIL,
        },
      });

      const result = await response.json();

      const testResult = {
        test: test.name,
        expected: test.expected,
        actual: response.ok ? 'success' : 'error',
        status: response.status,
        passed: false,
      };

      if (test.expected === 'success') {
        testResult.passed = response.ok && result.success;
      } else {
        testResult.passed = !response.ok && response.status === (test.expectedStatus || 400);
      }

      results.push(testResult);
      console.log(
        `    ${testResult.passed ? '✅' : '❌'} ${testResult.passed ? 'PASSED' : 'FAILED'}`
      );

      if (!testResult.passed) {
        console.log(`    Expected: ${test.expected}, Got: ${testResult.actual}`);
        console.log(`    Status: ${response.status}, Response:`, result);
      }
    } catch (error) {
      console.log(`    ❌ ERROR: ${error.message}`);
      results.push({
        test: test.name,
        expected: test.expected,
        actual: 'error',
        passed: false,
        error: error.message,
      });
    }
  }

  return results;
}

// Test upload configuration endpoint
async function testUploadConfiguration() {
  console.log('🧪 Testing Upload Configuration...');

  try {
    const response = await fetch(`${TEST_CONFIG.API_BASE}/storage/upload`);
    const config = await response.json();

    const tests = [
      {
        name: 'Max file size is 2MB',
        check: config.maxFileSize === TEST_CONFIG.MAX_FILE_SIZE,
        value: config.maxFileSize,
      },
      {
        name: 'Allowed MIME types include images',
        check: config.allowedMimeTypes.includes('image/jpeg'),
        value: config.allowedMimeTypes,
      },
      {
        name: 'Categories include required types',
        check: ['receipt', 'fault', 'avatar', 'announcement'].every(cat =>
          config.categories.includes(cat)
        ),
        value: config.categories,
      },
    ];

    const results = tests.map(test => {
      console.log(`  ${test.check ? '✅' : '❌'} ${test.name}`);
      if (!test.check) {
        console.log(`    Value: ${JSON.stringify(test.value)}`);
      }
      return { ...test, passed: test.check };
    });

    return results;
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    return [{ name: 'Configuration fetch', passed: false, error: error.message }];
  }
}

// Test admin file management endpoints
async function testAdminFileManagement() {
  console.log('🧪 Testing Admin File Management...');

  const tests = [
    {
      name: 'List all files',
      endpoint: '/admin/files',
      method: 'GET',
    },
    {
      name: 'Filter files by category',
      endpoint: '/admin/files?category=receipt',
      method: 'GET',
    },
    {
      name: 'Filter files by age',
      endpoint: '/admin/files?ageMonths=3',
      method: 'GET',
    },
    {
      name: 'Get storage statistics',
      endpoint: '/admin/storage/stats',
      method: 'GET',
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`  Testing: ${test.name}`);

      const response = await fetch(`${TEST_CONFIG.API_BASE}${test.endpoint}`, {
        method: test.method,
        headers: {
          'x-user-email': TEST_CONFIG.ADMIN_EMAIL,
        },
      });

      const result = await response.json();
      const passed = response.ok && (result.success || result.stats);

      console.log(`    ${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}`);

      if (!passed) {
        console.log(`    Status: ${response.status}, Response:`, result);
      }

      results.push({
        test: test.name,
        passed,
        status: response.status,
        response: result,
      });
    } catch (error) {
      console.log(`    ❌ ERROR: ${error.message}`);
      results.push({
        test: test.name,
        passed: false,
        error: error.message,
      });
    }
  }

  return results;
}

// Test unauthorized access
async function testUnauthorizedAccess() {
  console.log('🧪 Testing Unauthorized Access...');

  const tests = [
    {
      name: 'Admin files endpoint without auth',
      endpoint: '/admin/files',
      method: 'GET',
      expectedStatus: 401,
    },
    {
      name: 'Storage stats without auth',
      endpoint: '/admin/storage/stats',
      method: 'GET',
      expectedStatus: 401,
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`  Testing: ${test.name}`);

      const response = await fetch(`${TEST_CONFIG.API_BASE}${test.endpoint}`, {
        method: test.method,
        // No auth headers
      });

      const passed = response.status === test.expectedStatus;

      console.log(`    ${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}`);

      if (!passed) {
        console.log(`    Expected status: ${test.expectedStatus}, Got: ${response.status}`);
      }

      results.push({
        test: test.name,
        passed,
        expectedStatus: test.expectedStatus,
        actualStatus: response.status,
      });
    } catch (error) {
      console.log(`    ❌ ERROR: ${error.message}`);
      results.push({
        test: test.name,
        passed: false,
        error: error.message,
      });
    }
  }

  return results;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Running Enhanced Storage System Tests\n');

  const testSuites = [
    { name: 'Upload Configuration', test: testUploadConfiguration },
    { name: 'File Upload Validation', test: testFileUploadValidation },
    { name: 'Admin File Management', test: testAdminFileManagement },
    { name: 'Unauthorized Access', test: testUnauthorizedAccess },
  ];

  const allResults = [];

  for (const suite of testSuites) {
    console.log(`\n📋 ${suite.name}`);
    console.log('═'.repeat(50));

    try {
      const results = await suite.test();
      allResults.push({ suite: suite.name, results });
    } catch (error) {
      console.log(`❌ Test suite failed: ${error.message}`);
      allResults.push({
        suite: suite.name,
        results: [{ test: 'Suite execution', passed: false, error: error.message }],
      });
    }
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));

  let totalTests = 0;
  let passedTests = 0;

  allResults.forEach(suite => {
    const suiteTotal = suite.results.length;
    const suitePassed = suite.results.filter(r => r.passed).length;

    totalTests += suiteTotal;
    passedTests += suitePassed;

    console.log(`${suite.suite}: ${suitePassed}/${suiteTotal} passed`);
  });

  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The enhanced storage system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    successRate: Math.round((passedTests / totalTests) * 100),
    results: allResults,
  };
}

// Instructions for running the test
console.log('Enhanced Storage System Test Suite');
console.log('=====================================');
console.log('');
console.log('To run this test:');
console.log('1. Make sure your Next.js development server is running on http://localhost:3000');
console.log('2. Ensure you have admin access configured');
console.log('3. Open browser developer console and paste this entire script');
console.log('4. Call runAllTests() to execute all tests');
console.log('');
console.log('Example: runAllTests().then(results => console.log(results));');
console.log('');

// Export for use
if (typeof window !== 'undefined') {
  window.storageSystemTest = {
    runAllTests,
    testFileUploadValidation,
    testUploadConfiguration,
    testAdminFileManagement,
    testUnauthorizedAccess,
    createTestFile,
    createLargeTestFile,
    createValidTestFile,
  };
}
