#!/usr/bin/env node
/**
 * Test script for Payment Events API
 *
 * This script helps test the payment events functionality locally and in deployment.
 *
 * Usage:
 * node scripts/test-payment-events.js [base-url]
 *
 * Examples:
 * node scripts/test-payment-events.js http://localhost:3000
 * node scripts/test-payment-events.js https://your-site.netlify.app
 */
import http from 'http';
import https from 'https';

const BASE_URL = process.argv[2] || 'http://localhost:3000';

console.log(`\n🧪 Testing Payment Events API at: ${BASE_URL}\n`);

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
}

interface ApiResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  data: any;
}

async function makeRequest(url: string, options: RequestOptions = {}): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.request(url, options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode || 0, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode || 0, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testHealthEndpoint(): Promise<void> {
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/payment-events/health`);
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      console.log('   ✅ Health check passed');
      if (response.data && typeof response.data === 'object') {
        console.log(`   Firebase Admin: ${response.data.checks?.firebaseAdmin ? '✅' : '❌'}`);
        console.log(`   Authentication: ${response.data.checks?.authentication ? '✅' : '❌'}`);
        console.log(`   Firestore: ${response.data.checks?.firestoreConnection ? '✅' : '❌'}`);
        console.log(
          `   Payment Events Query: ${response.data.checks?.paymentEventsQuery ? '✅' : '❌'}`
        );

        if (response.data.errors && response.data.errors.length > 0) {
          console.log('   Errors:');
          response.data.errors.forEach((error: string) => console.log(`     - ${error}`));
        }
      }
    } else {
      console.log(`   ❌ Health check failed`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Health endpoint error: ${errorMessage}`);
  }
  console.log('');
}

async function testNetlifyTest(): Promise<void> {
  console.log('2. Testing Netlify Test Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/netlify-test`);
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      console.log('   ✅ Netlify test passed');
      if (response.data && typeof response.data === 'object') {
        console.log(`   Environment: ${response.data.environment}`);
        console.log(`   Netlify Context: ${response.data.netlifyContext}`);
        console.log(
          `   Firebase Project ID: ${response.data.env?.FIREBASE_PROJECT_ID ? '✅' : '❌'}`
        );
      }
    } else {
      console.log(`   ❌ Netlify test failed`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Netlify test error: ${errorMessage}`);
  }
  console.log('');
}

async function testPaymentEventsEndpoint(): Promise<void> {
  console.log('3. Testing Payment Events Endpoint (without auth)...');
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const response = await makeRequest(`${BASE_URL}/api/payment-events?monthYear=${currentMonth}`);
    console.log(`   Status: ${response.status}`);

    if (response.status === 401) {
      console.log('   ✅ Correctly requires authentication');
    } else if (response.status === 200) {
      console.log('   ⚠️  Payment events endpoint returned data without authentication');
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`   ❌ Unexpected status code`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Payment events endpoint error: ${errorMessage}`);
  }
  console.log('');
}

async function runTests(): Promise<void> {
  await testHealthEndpoint();
  await testNetlifyTest();
  await testPaymentEventsEndpoint();

  console.log('🏁 Testing complete!\n');
  console.log('Next steps:');
  console.log('1. If health checks fail, check Firebase configuration');
  console.log('2. If authentication fails, check session management');
  console.log('3. If Firestore fails, check Firebase Admin setup');
  console.log('4. Test with real user authentication in the browser');
}

runTests().catch(console.error);
