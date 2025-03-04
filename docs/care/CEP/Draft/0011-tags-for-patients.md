# CEP-11: Patient Tagging System in CARE

### Motive

Care is being used in various healthcare environments for managing patient information and care delivery. A flexible and robust patient tagging system is essential for efficient patient categorization, filtering, and management. This system will enable healthcare providers to quickly identify patients with specific characteristics, conditions, or care requirements, enhancing the overall quality of care and operational efficiency.

### Requirements

### 1. Tag Creation and Management

- The system shall allow authorized users (nurses and doctors) to create tags at the facility level.
- Tags shall have a name and an optional description.
- Tags shall be unique within a facility.
- The system shall provide functionality to edit and delete existing tags.

### 2. Tag Assignment

- Authorized users shall be able to assign tags to patients.
- Multiple tags can be assigned to a single patient.
- The system shall maintain a log of tag assignments and removals, including the user who performed the action and the timestamp in event logs.

### 3. Tag Visibility and Access Control

- Tags shall be visible on the patient's profile.
- Tags shall be facility-specific and not visible to other facilities.

### 4. Filtering and Searching

- The system shall provide functionality to filter patients by one or multiple tags.
- Advanced search capabilities shall be implemented to find patients with specific tag combinations.

### 5. Customization and Extensibility

- Care should have a default set of tags instance level.
- Instance admins should be able able to seed tags instance level.
- The system shall allow for custom tag attributes to be defined at the facility level.
- The architecture shall be flexible to allow future extensions, such as automated tag assignment based on clinical data.

### Implementation (Frontend) : 

### 1. Tag Management UI (Facility Level)
  - Who can access? Admins (to create, edit, delete tags).
  - Where? Inside the Facility Settings page.
    
    #### Features :
    -  List all tags in a table with name, description, and actions.
    - "Create Tag" button → Opens a modal for entering tag name & description.
    - Edit/Delete tags using buttons inside the list.
    - Form validation → Tags must be unique within a facility.

### 2. Tagging Patients (Patient Profile Page)
  - Who can access? Doctors & Nurses (to assign/remove tags).
  - Where? Patient Profile Page (right under patient name).

    #### Features :
    - Show existing tags as badges under patient name.
    - "Add Tag" button → Dropdown autocomplete search to assign a tag.
    - Remove a tag using a small "x" button inside each badge.
    - Event logs → Every assignment/removal is logged.

### 3. Patient Filtering (Tag-Based Search)
  - Who can access? All healthcare staff.
  - Where? Patient List Page (top filter bar).
       
### Implementation (Backend) : 

### 1. Database Schema 
```
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(facility_id, name)
);

CREATE TABLE patient_tags (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
  #### Constraints : 
  - Tags are unique within a facility.
  - Each patient can have multiple tags.
  - Tag assignments are logged with user ID & timestamp.

### 2. API Endpoints

### Tag Creation & Management

| Method  | Endpoint                                      | Description                      |
|---------|----------------------------------------------|----------------------------------|
| **POST**   | `/facilities/{facility_id}/tags/`          | Create a tag                     |
| **GET**    | `/facilities/{facility_id}/tags/`          | List all tags in a facility      |
| **PATCH**  | `/facilities/{facility_id}/tags/{tag_id}/` | Update tag name/description      |
| **DELETE** | `/facilities/{facility_id}/tags/{tag_id}/` | Delete a tag                     |

---

### Tag Assignment

| Method  | Endpoint                                   | Description                     |
|---------|-------------------------------------------|---------------------------------|
| **POST**   | `/patients/{patient_id}/tags/`          | Assign a tag to a patient       |
| **DELETE** | `/patients/{patient_id}/tags/{tag_id}/` | Remove a tag from a patient     |
| **GET**    | `/patients/{patient_id}/tags/`          | List all tags for a patient     |

---

### Filtering & Searching

| Method  | Endpoint                                   | Description                     |
|---------|-------------------------------------------|---------------------------------|
| **GET**    | `/patients/?tags=diabetic,high-risk`    | Get patients by tag(s)          |

### 3. Event Logging
- Every tag assignment and removal will be logged.
- Logs will store:
  - User ID (who assigned/removed the tag).
  - Timestamp.
  - Tag details.

### Database Schema Event Logs : 
    
```
    CREATE TABLE event_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      tag_id INTEGER NOT NULL REFERENCES tags(id),
      action TEXT NOT NULL, -- 'assigned' or 'removed'
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
```

### WorkFLow of the Project : 
1. Admin creates tags in Facility Settings.
2. Doctors/Nurses assign tags to patients.
3. Tags appear in the Patient Profile Page.
5. Users filter patients using tags.

### Timeline of the Project : 
- Day 1	Database schema design & migrations
- Day 2	Backend API for tag management
- Day 3	Backend API for patient tag assignment & filtering
- Day 4	Frontend: Tag creation & management UI
- Day 5	Frontend: Assigning & filtering patients by tags
- Day 6	Integration, testing & bug fixes
- Day 7	Final review & deployment 🚀
