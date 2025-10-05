# Payment Events Scheduler

The Payment Events Scheduler is a system that automatically generates recurring payment events (such as monthly maintenance fees) for all apartments based on configured categories.

## Overview

The scheduler runs as an API endpoint that can be triggered manually or by external cron jobs. It checks configured categories with payment event generation enabled and creates payment records for all apartments on the specified day of each month.

## Configuration

To enable automatic payment event generation, categories must be configured with the following properties:

- `isPaymentEvent: true` - Marks the category as a payment event generator
- `autoGenerate: true` - Enables automatic generation
- `monthlyAmount: number` - The amount to charge each month
- `dayOfMonth: number` - The day of the month to generate events (1-28, default: 1)

## Scheduler API Endpoints

### POST /api/payment-events/scheduler

Triggers the automated payment event generation process.

#### Authentication

This endpoint can be authenticated in two ways:

1. Using a scheduler token in the `x-scheduler-token` header
2. Using admin authentication via Firebase session cookie

#### Request Body

```json
{
  "monthYear": "2024-01", // Optional: Specific month to generate events for (YYYY-MM format)
  "force": false // Optional: Force generation even if events already exist (default: false)
}
```

#### Response

```json
{
  "success": true,
  "message": "Automated generation completed: 7 payment events created for 2024-01",
  "monthYear": "2024-01",
  "eventsCreated": 7,
  "processedCategories": 1,
  "results": [
    {
      "categoryId": "maintenance",
      "categoryName": "Maintenance Fee",
      "eventsCreated": 7
    }
  ],
  "scheduledOn": "2024-01-01T10:00:00Z",
  "triggerDay": 1
}
```

#### Scheduler Token Setup

To use the scheduler with an API key, set the `SCHEDULER_TOKEN` environment variable in your deployment environment:

```bash
SCHEDULER_TOKEN=your-secret-scheduler-token
```

Then call the endpoint with the token in the header:

```bash
curl -X POST https://your-domain.com/api/payment-events/scheduler \
  -H "Content-Type: application/json" \
  -H "x-scheduler-token: your-secret-scheduler-token" \
  -d '{"monthYear": "2024-01"}'
```

### GET /api/payment-events/scheduler

Retrieves the current scheduler status and upcoming scheduled dates.

#### Authentication

Requires admin authentication via Firebase session cookie.

#### Response

```json
{
  "success": true,
  "currentDate": "2024-01-15T10:00:00Z",
  "currentDay": 15,
  "currentMonth": "2024-01",
  "totalConfiguredCategories": 1,
  "scheduledCategories": [
    {
      "categoryId": "maintenance",
      "categoryName": "Maintenance Fee",
      "monthlyAmount": 2500,
      "dayOfMonth": 1,
      "nextGenerationDate": "2024-02-01",
      "isScheduledToday": false
    }
  ],
  "schedulerStatus": "active",
  "upcomingGenerations": [
    {
      "categoryId": "maintenance",
      "categoryName": "Maintenance Fee",
      "monthlyAmount": 2500,
      "dayOfMonth": 1,
      "nextGenerationDate": "2024-02-01",
      "isScheduledToday": false
    }
  ]
}
```

## Setting Up Automated Scheduling

To set up automated scheduling, you'll need to configure a cron job or scheduled task in your hosting environment that calls the scheduler endpoint.

### Example with Cron

```bash
# Run daily at 2:00 AM
0 2 * * * curl -X POST https://your-domain.com/api/payment-events/scheduler \
  -H "Content-Type: application/json" \
  -H "x-scheduler-token: your-secret-scheduler-token"
```

### Example with Netlify Scheduled Functions

If using Netlify, you can create a scheduled function:

```javascript
// netlify/functions/scheduler.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    const response = await fetch('https://your-domain.com/api/payment-events/scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-scheduler-token': process.env.SCHEDULER_TOKEN,
      },
    });

    const result = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scheduler failed', details: error.message }),
    };
  }
};
```

And configure it in `netlify.toml`:

```toml
[functions.scheduler]
schedule = "0 2 * * *"  # Run daily at 2:00 AM
```

## Manual Trigger

You can also manually trigger payment event generation through the admin panel or by calling the endpoint directly:

```bash
# Using curl with scheduler token
curl -X POST https://your-domain.com/api/payment-events/scheduler \
  -H "Content-Type: application/json" \
  -H "x-scheduler-token: your-secret-scheduler-token" \
  -d '{"monthYear": "2024-01"}'

# Using curl with admin authentication
curl -X POST https://your-domain.com/api/payment-events/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your-admin-session-cookie" \
  -d '{"monthYear": "2024-01"}'

# Using the test script (Unix/Mac/Linux)
node scripts/test-payment-scheduler.js 2024-01

# Using the batch file (Windows)
scripts\test-payment-scheduler.bat 2024-01
```

## How It Works

1. The scheduler checks all categories configured with `isPaymentEvent: true` and `autoGenerate: true`
2. For each qualifying category, it verifies if the current day matches the configured `dayOfMonth`
3. If it's the right day (or force is true), it generates payment events for all apartments
4. Each apartment receives a payment event with the configured `monthlyAmount`
5. Payment events are stored in the `payments` collection with `category: 'income'`

## Error Handling

The scheduler includes comprehensive error handling:

- Skips categories that don't meet configuration requirements
- Prevents duplicate payment events for the same month
- Continues processing other categories even if one fails
- Provides detailed error messages in the response

## Best Practices

1. Set the `dayOfMonth` to early in the month (1-5) to ensure timely payment reminders
2. Use the `force` parameter sparingly, as it can create duplicate payment events
3. Monitor the scheduler logs to ensure proper execution
4. Set up alerts for scheduler failures
5. Regularly review configured categories and their payment event settings
