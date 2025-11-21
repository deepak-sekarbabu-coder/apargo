#!/usr/bin/env node
/**
 * Test script for Payment Events Scheduler
 *
 * This script can be used to manually trigger the payment events scheduler
 * for testing purposes.
 *
 * Usage:
 *   node scripts/test-payment-scheduler.js [monthYear] [force]
 *
 * Examples:
 *   node scripts/test-payment-scheduler.js          # Current month
 *   node scripts/test-payment-scheduler.js 2024-01  # Specific month
 *   node scripts/test-payment-scheduler.js 2024-01 true  # Force generation
 */
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const monthYear = args[0] || new Date().toISOString().slice(0, 7); // Default to current month
const force = args[1] === 'true'; // Force generation if true

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, '$1'); // Remove quotes if present
    }
  });
}

// Get the base URL from environment or default to localhost
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SCHEDULER_TOKEN = process.env.SCHEDULER_TOKEN;

// Validate environment
if (!SCHEDULER_TOKEN) {
  console.error('❌ Error: SCHEDULER_TOKEN not found in environment variables');
  console.error('Please set SCHEDULER_TOKEN in your .env.local file');
  process.exit(1);
}

// Determine if we're using HTTPS
const isHttps = BASE_URL.startsWith('https://');
const client = isHttps ? https : http;

// Remove protocol from URL for request options
const urlWithoutProtocol = BASE_URL.replace(/^https?:\/\//, '');
const [hostname, portString] = urlWithoutProtocol.split(':');
const port = portString ? parseInt(portString) : isHttps ? 443 : 80;

// Prepare request data
const postData = JSON.stringify({
  monthYear,
  force,
});

// Request options
const options: http.RequestOptions = {
  hostname,
  port,
  path: '/api/payment-events/scheduler',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-scheduler-token': SCHEDULER_TOKEN,
  },
};

console.log(`🚀 Triggering payment events scheduler...`);
console.log(`   URL: ${BASE_URL}/api/payment-events/scheduler`);
console.log(`   Month: ${monthYear}`);
console.log(`   Force: ${force}`);
console.log('');

// Make the request
const req = client.request(options, res => {
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Scheduler executed successfully:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error(`❌ Scheduler failed with status ${res.statusCode}:`);
        console.error(JSON.stringify(result, null, 2));
      }
    } catch (parseError) {
      console.error('❌ Failed to parse response:');
      console.error(data);
    }
  });
});

req.on('error', error => {
  console.error('❌ Request failed:');
  console.error(error.message);
});

// Write data to request body
req.write(postData);
req.end();
