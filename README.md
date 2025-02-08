# Loggify-Lite 🔍

A powerful yet lightweight browser logging library designed for modern web applications. Loggify-Lite seamlessly captures console outputs, errors, warnings, and network requests while maintaining exceptional performance and minimal overhead.

## Overview

Loggify-Lite provides comprehensive logging capabilities for browser-based applications, enabling developers to effectively monitor, debug, and analyze application behavior in production environments. With its efficient architecture and thoughtful design, it offers robust logging features without compromising application performance.

## Key Features

- **Error Tracking**

  - Automatic capture of unhandled errors and exceptions
  - Detailed stack traces and error contexts
  - Custom error handling capabilities

- **Console Monitoring**

  - Seamless override of console.log, warn, and error methods
  - Configurable sampling rates for different log levels
  - Preservation of original console functionality

- **Network Request Tracking**

  - Complete monitoring of Fetch API calls
  - XMLHttpRequest (XHR) request tracking
  - Request/response payload logging
  - Performance metrics collection

- **Developer-Friendly**

  - Full TypeScript support with type definitions
  - Comprehensive API documentation
  - Flexible configuration options
  - Easy integration with existing projects

- **Optimized Performance**

  - Minimal bundle size (<5KB gzipped)
  - Zero production dependencies
  - Efficient IndexedDB storage
  - Configurable event sampling

- **Data Management**
  - Persistent storage using IndexedDB
  - Automatic log rotation
  - Customizable retention policies
  - JSON export functionality

## Installation

Install Loggify-Lite using npm:

```bash
npm install loggify-lite
```

## Usage

```ts
import { initializeLogger } from 'loggify-lite';

initializeLogger({
  maxDBSize: 5 * 1024 * 1024, // 5MB
  maxEvents: 1000,
  windowMs: 60000,
  samplingRates: {
    ERROR: 1,
  },
});
```

## Configuration Options

### `maxDBSize`

- **Type:** `number`
- **Default:** `5 * 1024 * 1024` (5MB)
- **Description:** The maximum size of the IndexedDB database.

### `maxEvents`

- **Type:** `number`
- **Default:** `1000`

### `windowMs`

- **Type:** `number`
- **Default:** `60000` (1 minute)
- **Description:** The time window in milliseconds for event sampling.

### `samplingRates`

- **Type:** `Record<string, number>`
- **Default:** `{}`
- **Description:** The sampling rates for different log levels.
