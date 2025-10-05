#!/usr/bin/env node

/**
 * Netlify deployment verification script
 * Checks if API routes are properly configured and accessible
 */

const https = require('https');
const http = require('http');

// Your Netlify URL - update this to your actual domain
const NETLIFY_URL = process.env.NETLIFY_URL || 'https://your-app.netlify.app';

const testEndpoints = ['/api/health', '/api/test', '/api/auth/session'];

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'User-Agent': 'Netlify-Test-Script/1.0',
        Accept: 'application/json',
      },
    };

    const req = client.request(url, options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
        });
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoint(path) {
  const fullUrl = `${NETLIFY_URL}${path}`;

  try {
    console.log(`Testing: ${fullUrl}`);
    const result = await makeRequest(fullUrl);

    if (result.status === 200) {
      console.log(`✅ ${path}: OK (${result.status})`);
    } else if (result.status === 404) {
      console.log(`❌ ${path}: Not Found (${result.status})`);
      if (result.data.includes('Page not found')) {
        console.log('   ^ This is a Netlify 404 page - API routing issue!');
      }
    } else {
      console.log(`⚠️  ${path}: Status ${result.status}`);
    }

    return result;
  } catch (error) {
    console.log(`❌ ${path}: Error - ${error.message}`);
    return { error: error.message };
  }
}

async function main() {
  console.log('🚀 Testing Netlify deployment API routes...');
  console.log(`Base URL: ${NETLIFY_URL}\n`);

  if (NETLIFY_URL.includes('your-app.netlify.app')) {
    console.log('⚠️  Please update NETLIFY_URL in the script with your actual domain\n');
  }

  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    console.log(''); // Empty line for readability
  }

  console.log('✨ Test complete!');
  console.log('\nIf you see "Page not found" responses, check:');
  console.log('1. netlify.toml configuration');
  console.log('2. @netlify/plugin-nextjs is installed');
  console.log('3. API routes exist in src/app/api/');
  console.log('4. Build completed successfully');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, makeRequest };
