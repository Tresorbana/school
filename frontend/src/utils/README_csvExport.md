# Simple CSV Export Utility

A simple utility that takes a data array and filename, and handles the CSV download.

## Features

- ✅ Takes array of objects and converts to CSV
- ✅ Automatic CSV field escaping (handles commas, quotes, newlines)
- ✅ Automatic filename generation with date and unique ID
- ✅ Simple API - just data and filename

## Basic Usage

```typescript
import { exportToCSV, generateFilename } from '../utils/csvExport';

// Your data array
const students = [
  { name: 'John Doe', age: 20, grade: 'A' },
  { name: 'Jane Smith', age: 19, grade: 'B' }
];

// Generate filename and export
const filename = generateFilename('students_report');
exportToCSV(students, filename);
```

## Data Formatting

The utility automatically uses object keys as CSV headers. Format your data before passing it:

```typescript
// Format data with desired column names
const exportData = rawData.map(item => ({
  'Student Name': item.full_name,
  'Age': item.age,
  'Registration Date': new Date(item.created_at).toLocaleDateString(),
  'Status': item.is_active ? 'Active' : 'Inactive'
}));

exportToCSV(exportData, 'formatted_report.csv');
```

## Filename Generation

```typescript
// Basic: prefix_YYYY-MM-DD_randomId.csv
const filename1 = generateFilename('report');
// Example: report_2026-01-12_abc123def.csv

// With specific date
const filename2 = generateFilename('monthly_report', '2026-01-01');
// Example: monthly_report_2026-01-01_xyz789abc.csv

// With custom ID
const filename3 = generateFilename('export', new Date(), 'custom123');
// Example: export_2026-01-12_custom123.csv
```

## Complete Example

```typescript
import { exportToCSV, generateFilename } from '../utils/csvExport';
import { useToast } from '../context/ToastContext';

const handleExport = () => {
  try {
    if (!data || data.length === 0) {
      addToast({
        message: 'No data to export',
        type: 'error'
      });
      return;
    }

    // Format data for export
    const exportData = data.map(item => ({
      'Name': item.full_name,
      'Email': item.email,
      'Date': new Date(item.created_at).toLocaleDateString(),
      'Status': item.is_active ? 'Active' : 'Inactive'
    }));

    const filename = generateFilename('user_export');
    exportToCSV(exportData, filename);
    
    addToast({
      message: `Data exported as ${filename}`,
      type: 'success'
    });
  } catch (error) {
    addToast({
      message: 'Export failed',
      type: 'error'
    });
  }
};
```

## API Reference

### `exportToCSV(data, filename)`
- `data`: Array of objects to export
- `filename`: Name of the CSV file (with .csv extension)

### `generateFilename(prefix, date?, id?)`
- `prefix`: File prefix (will be cleaned of special characters)
- `date`: Optional date (defaults to current date)
- `id`: Optional custom ID (defaults to random ID)

Returns: `string` in format `prefix_YYYY-MM-DD_id.csv`