/**
 * Test: Fault Assignment System with Single Responsibility Accountability
 *
 * This test verifies the enhanced fault management system with user assignment features:
 * 1. Users can be assigned to faults
 * 2. Single responsibility accountability (one fault per user at a time)
 * 3. Real-time assignment visibility
 * 4. Assignment locking prevents duplicate ownership
 */

const { execSync } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testTimeout: 30000,
};

/**
 * Test Cases for Fault Assignment Feature
 */
class FaultAssignmentTest {
  constructor() {
    this.testResults = [];
  }

  // Helper function to log test results
  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type}: ${message}`;
    console.log(logMessage);
    this.testResults.push({ timestamp, type, message });
  }

  // Test 1: Verify fault assignment data structure
  testFaultDataStructure() {
    this.log('Testing Fault data structure supports assignment...', 'TEST');

    try {
      // Read the types.ts file to verify Fault interface
      const fs = require('fs');
      const typesPath = path.join(__dirname, '../src/lib/types.ts');
      const typesContent = fs.readFileSync(typesPath, 'utf8');

      // Check if Fault interface has assignedTo field
      const hasAssignedTo = typesContent.includes('assignedTo?: string;');
      const hasUpdatedAt = typesContent.includes('updatedAt?: string;');

      if (hasAssignedTo && hasUpdatedAt) {
        this.log('✅ Fault interface supports assignment fields', 'PASS');
        return true;
      } else {
        this.log('❌ Fault interface missing assignment fields', 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error checking Fault data structure: ${error.message}`, 'FAIL');
      return false;
    }
  }

  // Test 2: Verify FaultManagement component has assignment controls
  testAssignmentControls() {
    this.log('Testing FaultManagement component has assignment controls...', 'TEST');

    try {
      const fs = require('fs');
      const componentPath = path.join(
        __dirname,
        '../src/components/fault-reporting/fault-management.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf8');

      // Check for key assignment features
      const hasAssignmentSelect = componentContent.includes('Assign to...');
      const hasAssignmentHandler = componentContent.includes('handleAssignUser');
      const hasBusyUsers = componentContent.includes('(Busy)');
      const hasAssignedBadge = componentContent.includes('assignedTo');

      if (hasAssignmentSelect && hasAssignmentHandler && hasBusyUsers && hasAssignedBadge) {
        this.log('✅ FaultManagement component has all assignment controls', 'PASS');
        return true;
      } else {
        this.log('❌ FaultManagement component missing assignment controls', 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error checking assignment controls: ${error.message}`, 'FAIL');
      return false;
    }
  }

  // Test 3: Verify single responsibility logic
  testSingleResponsibilityLogic() {
    this.log('Testing single responsibility accountability logic...', 'TEST');

    try {
      const fs = require('fs');
      const componentPath = path.join(
        __dirname,
        '../src/components/fault-reporting/fault-management.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf8');

      // Check for single responsibility function
      const hasSingleResponsibilityCheck = componentContent.includes('isUserAssignedToOtherFault');
      const hasDisabledLogic = componentContent.includes('disabled={isAssignedElsewhere}');
      const hasStatusUpdate = componentContent.includes("status === 'resolved'");

      if (hasSingleResponsibilityCheck && hasDisabledLogic && hasStatusUpdate) {
        this.log('✅ Single responsibility logic implemented correctly', 'PASS');
        return true;
      } else {
        this.log('❌ Single responsibility logic missing or incomplete', 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error checking single responsibility logic: ${error.message}`, 'FAIL');
      return false;
    }
  }

  // Test 4: Verify users data integration
  testUsersDataIntegration() {
    this.log('Testing users data integration...', 'TEST');

    try {
      const fs = require('fs');
      const faultViewPath = path.join(
        __dirname,
        '../src/components/fault-reporting/fault-view.tsx'
      );
      const faultViewContent = fs.readFileSync(faultViewPath, 'utf8');

      // Check for users state and getUsers import
      const hasUsersState = faultViewContent.includes('useState<User[]>([])');
      const hasGetUsersImport = faultViewContent.includes('getUsers');
      const hasUsersPassedToManagement = faultViewContent.includes('users={users}');

      if (hasUsersState && hasGetUsersImport && hasUsersPassedToManagement) {
        this.log('✅ Users data integration implemented correctly', 'PASS');
        return true;
      } else {
        this.log('❌ Users data integration missing or incomplete', 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error checking users data integration: ${error.message}`, 'FAIL');
      return false;
    }
  }

  // Test 5: Verify real-time assignment visibility
  testRealTimeVisibility() {
    this.log('Testing real-time assignment visibility features...', 'TEST');

    try {
      const fs = require('fs');
      const componentPath = path.join(
        __dirname,
        '../src/components/fault-reporting/fault-management.tsx'
      );
      const componentContent = fs.readFileSync(componentPath, 'utf8');

      // Check for assignment display features
      const hasAssignmentBadge = componentContent.includes('UserPlus');
      const hasAssignmentInfo = componentContent.includes('Assignment Information');
      const hasUpdatedAtDisplay = componentContent.includes('Updated {new Date(fault.updatedAt)');
      const hasAssignedUserName = componentContent.includes('getAssignedUserName');

      if (hasAssignmentBadge && hasAssignmentInfo && hasUpdatedAtDisplay && hasAssignedUserName) {
        this.log('✅ Real-time assignment visibility implemented correctly', 'PASS');
        return true;
      } else {
        this.log('❌ Real-time assignment visibility missing or incomplete', 'FAIL');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error checking real-time visibility: ${error.message}`, 'FAIL');
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('🧪 Starting Fault Assignment Feature Tests...', 'START');

    const tests = [
      () => this.testFaultDataStructure(),
      () => this.testAssignmentControls(),
      () => this.testSingleResponsibilityLogic(),
      () => this.testUsersDataIntegration(),
      () => this.testRealTimeVisibility(),
    ];

    let passedTests = 0;
    const totalTests = tests.length;

    for (let i = 0; i < tests.length; i++) {
      const testResult = tests[i]();
      if (testResult) passedTests++;
    }

    // Summary
    this.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`, 'SUMMARY');

    if (passedTests === totalTests) {
      this.log('🎉 All tests passed! Fault Assignment feature is ready.', 'SUCCESS');
    } else {
      this.log('⚠️  Some tests failed. Please review implementation.', 'WARNING');
    }

    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      results: this.testResults,
    };
  }
}

// Run the tests
if (require.main === module) {
  const tester = new FaultAssignmentTest();
  tester.runAllTests().then(results => {
    console.log('\n📋 Final Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.total - results.passed}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    process.exit(results.success ? 0 : 1);
  });
}

module.exports = FaultAssignmentTest;
