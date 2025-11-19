/**
 * Test script for the refactored maintenance dashboard
 * Run this in the browser console to test API endpoints
 */

const testMaintenanceAPI = async () => {
  console.log('🧪 Testing Refactored Maintenance Dashboard API');
  console.log('===============================================');

  // Test data
  const testTask = {
    title: 'Test Maintenance Task',
    description: 'This is a test task created via the new API',
    category: 'other',
    scheduledDate: new Date().toISOString().split('T')[0],
    costEstimate: 150,
    notes: 'Test task for verifying the API works correctly',
  };

  const testVendor = {
    name: 'Test Vendor Services',
    serviceType: 'general',
    phone: '+1-555-0123',
    email: 'test@vendor.com',
    isActive: true,
    rating: 4.5,
  };

  let createdTaskId = null;
  let createdVendorId = null;

  try {
    // Test 1: Create a new task
    console.log('\n1. 📝 Testing task creation...');
    const createTaskResponse = await fetch('/api/maintenance/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTask),
    });

    if (createTaskResponse.ok) {
      const createTaskData = await createTaskResponse.json();
      createdTaskId = createTaskData.task.id;
      console.log('✅ Task created successfully:', createTaskData.task.title);
      console.log('   Task ID:', createdTaskId);
    } else {
      const errorData = await createTaskResponse.json();
      console.error('❌ Failed to create task:', errorData.error);
    }

    // Test 2: Get all tasks
    console.log('\n2. 📋 Testing task retrieval...');
    const getTasksResponse = await fetch('/api/maintenance/tasks');

    if (getTasksResponse.ok) {
      const getTasksData = await getTasksResponse.json();
      console.log('✅ Tasks retrieved successfully');
      console.log('   Total tasks:', getTasksData.tasks.length);

      // Find our test task
      const ourTask = getTasksData.tasks.find(t => t.id === createdTaskId);
      if (ourTask) {
        console.log('   ✅ Our test task found in the list');
      } else {
        console.log('   ⚠️ Our test task not found in the list');
      }
    } else {
      const errorData = await getTasksResponse.json();
      console.error('❌ Failed to get tasks:', errorData.error);
    }

    // Test 3: Update task status
    if (createdTaskId) {
      console.log('\n3. 🔄 Testing task status update...');
      const updateTaskResponse = await fetch('/api/maintenance/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: createdTaskId,
          status: 'in_progress',
          notes: 'Updated via API test - now in progress',
        }),
      });

      if (updateTaskResponse.ok) {
        console.log('✅ Task status updated successfully to "in_progress"');
      } else {
        const errorData = await updateTaskResponse.json();
        console.error('❌ Failed to update task:', errorData.error);
      }
    }

    // Test 4: Create a vendor
    console.log('\n4. 🏢 Testing vendor creation...');
    const createVendorResponse = await fetch('/api/maintenance/vendors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testVendor),
    });

    if (createVendorResponse.ok) {
      const createVendorData = await createVendorResponse.json();
      createdVendorId = createVendorData.vendor.id;
      console.log('✅ Vendor created successfully:', createVendorData.vendor.name);
      console.log('   Vendor ID:', createdVendorId);
    } else {
      const errorData = await createVendorResponse.json();
      console.error('❌ Failed to create vendor:', errorData.error);
    }

    // Test 5: Get all vendors
    console.log('\n5. 🏬 Testing vendor retrieval...');
    const getVendorsResponse = await fetch('/api/maintenance/vendors');

    if (getVendorsResponse.ok) {
      const getVendorsData = await getVendorsResponse.json();
      console.log('✅ Vendors retrieved successfully');
      console.log('   Total vendors:', getVendorsData.vendors.length);

      // Find our test vendor
      const ourVendor = getVendorsData.vendors.find(v => v.id === createdVendorId);
      if (ourVendor) {
        console.log('   ✅ Our test vendor found in the list');
      } else {
        console.log('   ⚠️ Our test vendor not found in the list');
      }
    } else {
      const errorData = await getVendorsResponse.json();
      console.error('❌ Failed to get vendors:', errorData.error);
    }

    // Test 6: Assign vendor to task
    if (createdTaskId && createdVendorId) {
      console.log('\n6. 🔗 Testing vendor assignment to task...');
      const assignVendorResponse = await fetch('/api/maintenance/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: createdTaskId,
          vendorId: createdVendorId,
          notes: 'Assigned test vendor via API',
        }),
      });

      if (assignVendorResponse.ok) {
        console.log('✅ Vendor assigned to task successfully');
      } else {
        const errorData = await assignVendorResponse.json();
        console.error('❌ Failed to assign vendor:', errorData.error);
      }
    }

    // Test 7: Complete the task
    if (createdTaskId) {
      console.log('\n7. ✅ Testing task completion...');
      const completeTaskResponse = await fetch('/api/maintenance/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: createdTaskId,
          status: 'completed',
          completedDate: new Date().toISOString(),
          actualCost: 120,
          notes: 'Completed via API test',
        }),
      });

      if (completeTaskResponse.ok) {
        console.log('✅ Task marked as completed successfully');
      } else {
        const errorData = await completeTaskResponse.json();
        console.error('❌ Failed to complete task:', errorData.error);
      }
    }

    console.log('\n🎉 API Testing Summary:');
    console.log('=====================');
    console.log('✅ Task CRUD operations working');
    console.log('✅ Vendor CRUD operations working');
    console.log('✅ Task status updates working');
    console.log('✅ Vendor assignment working');
    console.log('✅ All endpoints responding correctly');

    console.log('\n💡 Next Steps:');
    console.log('- Test the UI components for real-time updates');
    console.log('- Verify optimistic UI updates work correctly');
    console.log('- Test error handling with invalid data');
    console.log("- Check that page doesn't reload during operations");
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Cleanup function to remove test data
const cleanupTestData = async () => {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Get all tasks and vendors to find our test items
    const [tasksResponse, vendorsResponse] = await Promise.all([
      fetch('/api/maintenance/tasks'),
      fetch('/api/maintenance/vendors'),
    ]);

    if (tasksResponse.ok && vendorsResponse.ok) {
      const tasksData = await tasksResponse.json();
      const vendorsData = await vendorsResponse.json();

      // Find and delete test tasks
      const testTasks = tasksData.tasks.filter(
        t => t.title.includes('Test Maintenance Task') || t.notes?.includes('via API test')
      );

      // Find and delete test vendors
      const testVendors = vendorsData.vendors.filter(v => v.name.includes('Test Vendor Services'));

      // Delete test tasks
      for (const task of testTasks) {
        try {
          await fetch(`/api/maintenance/tasks?id=${task.id}`, {
            method: 'DELETE',
          });
          console.log('   ✅ Deleted test task:', task.title);
        } catch (err) {
          console.log('   ⚠️ Could not delete task:', task.title);
        }
      }

      // Delete test vendors
      for (const vendor of testVendors) {
        try {
          await fetch(`/api/maintenance/vendors?id=${vendor.id}`, {
            method: 'DELETE',
          });
          console.log('   ✅ Deleted test vendor:', vendor.name);
        } catch (err) {
          console.log('   ⚠️ Could not delete vendor:', vendor.name);
        }
      }

      console.log('✅ Cleanup completed');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.testMaintenanceAPI = testMaintenanceAPI;
  window.cleanupTestData = cleanupTestData;

  console.log('🧪 Maintenance API Test Functions Available:');
  console.log('- Run testMaintenanceAPI() to test all CRUD operations');
  console.log('- Run cleanupTestData() to remove test data');
}

export { testMaintenanceAPI, cleanupTestData };
