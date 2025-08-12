# CARE Scripts

This directory contains utility scripts for the CARE frontend application.

## Location Import Script

### Overview

The `import-locations.js` script imports location data from the Sudheendra location-final Google Sheets into the CARE system via the API.

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed (version 18 or higher)
2. **CARE Backend**: A running CARE backend instance
3. **Authentication**: Valid CARE user credentials with permission to create locations
4. **Facility ID**: The target facility's ID where locations will be imported

### Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file in the project root with your CARE backend configuration:
   ```env
   REACT_CARE_API_URL=http://127.0.0.1:9000  # Your CARE backend URL
   CARE_USERNAME=administrator_2_0            # Your CARE username
   CARE_PASSWORD=Coronasafe@123              # Your CARE password
   ```

### Usage

#### Step 1: Export Data from Google Sheets

1. Open the [Google Sheets document](https://docs.google.com/spreadsheets/d/1-EgyAdtI17LWUaDSqXm6UHGBgTsX-qg7eiwHwn9SxlY/edit?usp=sharing)
2. Navigate to the "location-final (Sudheendra)" sheet tab
3. Go to **File > Download > Comma-separated values (.csv)**
4. Save the file as `location-final.csv` in the `scripts/` directory

#### Step 2: Run the Import Script

```bash
node scripts/import-locations.js location-final.csv <facility-id>
```

**Example**:
```bash
node scripts/import-locations.js location-final.csv abc123-def456-789
```

### CSV File Format

The CSV file should contain the following columns (case-insensitive):

| Column | Description | Required | Example Values |
|--------|-------------|----------|----------------|
| `name` | Location name | Yes | "ICU Ward", "Room 101", "Bed A1" |
| `description` | Location description | No | "Intensive Care Unit" |
| `type` | Location type | No | "ward", "room", "bed", "building" |
| `status` | Location status | No | "active", "inactive" |
| `operational_status` | Operational status | No | "open", "closed", "housekeeping" |
| `parent` | Parent location name | No | "ICU Ward" (for hierarchical locations) |

**Supported Location Types**:
- `site` → Site
- `building` → Building  
- `wing` → Wing
- `ward` → Ward
- `level`/`floor` → Level/Floor
- `corridor` → Corridor
- `room` → Room
- `bed` → Bed
- `vehicle` → Vehicle
- `house` → House
- `carpark` → Car Park
- `road` → Road
- `area` → Area
- `garden` → Garden
- `virtual` → Virtual

**Supported Operational Status**:
- `open` → Operational
- `closed` → Closed
- `housekeeping` → Housekeeping
- `unoccupied` → Unoccupied
- `contaminated` → Contaminated
- `isolated` → Isolated

### Features

- **Duplicate Prevention**: Skips locations that already exist in the facility
- **Hierarchical Support**: Handles parent-child location relationships
- **Error Handling**: Continues import even if individual locations fail
- **Progress Tracking**: Provides detailed console output with progress indicators
- **Rate Limiting**: Includes delays to avoid overwhelming the API

### Troubleshooting

#### Authentication Issues
```bash
❌ Authentication failed: 401 Unauthorized
```
**Solution**: Check your credentials in `.env.local` or environment variables.

#### Facility Not Found
```bash
❌ API call failed: 404 Not Found
```
**Solution**: Verify the facility ID is correct and exists in your CARE instance.

#### CSV Format Issues
```bash
⚠️ Skipping row 5: column count mismatch
```
**Solution**: Ensure all rows in the CSV have the same number of columns as the header.

#### Network Issues
```bash
❌ Network Error
```
**Solution**: 
- Check if the CARE backend is running
- Verify the `REACT_CARE_API_URL` is correct
- Ensure network connectivity

### Example Output

```bash
🎯 CARE Location Import Tool
📂 CSV File: location-final.csv
🏥 Facility ID: abc123-def456-789
🌐 API URL: http://127.0.0.1:9000
👤 Username: administrator_2_0

🔐 Authenticating with CARE API...
✅ Authentication successful
📄 Reading CSV file: location-final.csv
📊 Parsed 25 locations from CSV
🚀 Starting import of 25 locations to facility abc123-def456-789
📋 Fetching existing locations...
Found 5 existing locations
🏗️ Creating location: ICU Ward
✅ Created location: ICU Ward (ID: loc_123)
🏗️ Creating location: Room 101
✅ Created location: Room 101 (ID: loc_124)
⏭️ Skipping existing location: Emergency Ward

📊 Import Summary:
✅ Successfully imported: 20 locations
❌ Failed to import: 0 locations
⏭️ Skipped existing: 5 locations

🎉 Import completed successfully!
```

### Advanced Usage

#### Custom Authentication
```bash
CARE_USERNAME=your_username CARE_PASSWORD=your_password node scripts/import-locations.js location-final.csv facility-id
```

#### Different Backend
```bash
REACT_CARE_API_URL=https://your-care-backend.com node scripts/import-locations.js location-final.csv facility-id
```

### Contributing

When making changes to this script:

1. Test with a small CSV file first
2. Ensure error handling covers edge cases
3. Update this documentation
4. Add appropriate logging for debugging

### Related Documentation

- [CARE Backend Documentation](https://care-be-docs.ohc.network/)
- [CARE API Documentation](https://careapi.ohc.network/swagger/)
- [Location API Endpoints](../src/types/location/locationApi.ts)