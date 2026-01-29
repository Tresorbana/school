# RCAspire Backend API Documentation

## Overview
Complete REST API for RCAspire attendance and timetable management system at Rwanda Coding Academy.

**Routes File Location**: `Routes/api.php`

---

## 1. Authentication Routes (Public)

### 1.1 Sign Up
```
POST /signup
Content-Type: application/json

Request:
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@rca.rw",
  "password": "SecurePass123"
}

Success Response (201):
{
  "status": "success",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@rca.rw"
  }
}

Error Response (422):
{
  "status": "error",
  "message": "Email already exists"
}
```

### 1.2 Login
```
POST /login
Content-Type: application/json

Request:
{
  "email": "john@rca.rw",
  "password": "SecurePass123"
}

Success Response (200):
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@rca.rw",
    "roles": [1]
  }
}

Error Response (401):
{
  "status": "error",
  "message": "Invalid credentials"
}
```

### 1.3 Get Current User
```
GET /me
Authorization: Bearer <JWT_TOKEN>

Success Response (200):
{
  "status": "success",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@rca.rw",
    "roles": [1]
  }
}

Error Response (401):
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

---

## 2. Timetable Management Routes (Admin Only - Role 1)

### 2.1 Create Timetable
```
POST /timetable/create
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

Request:
{
  "year": 2024,
  "term": 1
}

Success Response (201):
{
  "status": "success",
  "message": "Timetable created with 1200 slots",
  "timetable_id": 15,
  "slots_created": 1200
}

Error Response (403):
{
  "status": "error",
  "message": "Insufficient permissions for this operation"
}
```

### 2.2 Edit Timetable Slot
```
POST /timetable/edit-slot
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

Request:
{
  "roster_id": 1234,
  "course_id": 5,
  "user_id": 42
}

Success Response (200):
{
  "status": "success",
  "message": "Timetable slot updated"
}

Error Response (422):
{
  "status": "error",
  "message": "Invalid roster ID"
}
```

### 2.3 Activate Timetable
```
POST /timetable/activate
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

Request:
{
  "timetable_id": 15
}

Success Response (200):
{
  "status": "success",
  "message": "Timetable activated successfully"
}

Error Response (404):
{
  "status": "error",
  "message": "Timetable not found"
}
```

### 2.4 Get Active Timetable
```
GET /timetable/get-active
Authorization: Bearer <TOKEN>

Success Response (200):
{
  "status": "success",
  "timetable": {
    "timetable_id": 15,
    "year": 2024,
    "term": 1,
    "is_active": true,
    "created_at": "2024-12-17T10:00:00Z"
  }
}

Error Response (404):
{
  "status": "error",
  "message": "No active timetable found"
}
```

### 2.5 Get Timetable Details
```
POST /timetable/details
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "timetable_id": 15
}

Success Response (200):
{
  "status": "success",
  "timetable": {
    "timetable_id": 15,
    "year": 2024,
    "term": 1,
    "roster_slots": 1200,
    "is_active": true
  }
}
```

### 2.6 Get Teacher Timetable
```
POST /timetable/teacher-schedule
Authorization: Bearer <TEACHER_TOKEN>
Content-Type: application/json

Request:
{
  "user_id": 42
}

Success Response (200):
{
  "status": "success",
  "schedule": [
    {
      "roster_id": 123,
      "course_id": 5,
      "course_name": "Mathematics",
      "class_name": "YA",
      "day_of_week": "Monday",
      "period": 1,
      "classroom": "A101"
    }
  ]
}
```

---

## 3. Attendance Management Routes

### 3.1 Get Pending Attendance (Teacher Only - Role 2)
```
POST /attendance/pending
Authorization: Bearer <TEACHER_TOKEN>
Content-Type: application/json

Request:
{
  "date": "2024-12-17"
}

Success Response (200):
{
  "status": "success",
  "pending": [
    {
      "roster_id": 123,
      "course_name": "Mathematics",
      "class_name": "YA",
      "period": 1,
      "student_count": 30
    }
  ]
}
```

### 3.2 Submit Course Attendance (Teacher Only - Role 2)
```
POST /attendance/submit-course
Authorization: Bearer <TEACHER_TOKEN>
Content-Type: application/json

Request:
{
  "roster_id": 123,
  "attendance": [
    {"student_id": 1, "is_present": true, "is_sick": false},
    {"student_id": 2, "is_present": false, "is_sick": false},
    {"student_id": 3, "is_present": false, "is_sick": true}
  ]
}

Success Response (200):
{
  "status": "success",
  "message": "Attendance submitted successfully",
  "record_id": 456,
  "submitted_at": "2024-12-17T10:30:00Z"
}

Error Response (409):
{
  "status": "error",
  "message": "Record already submitted and cannot be modified"
}
```

### 3.3 Submit Self-Study Attendance (Discipline Only - Role 3)
```
POST /attendance/submit-selfstudy
Authorization: Bearer <DISCIPLINE_TOKEN>
Content-Type: application/json

Request:
{
  "class_id": 5,
  "period": 1,
  "attendance": [
    {"student_id": 1, "is_present": true},
    {"student_id": 2, "is_present": false}
  ]
}

Success Response (200):
{
  "status": "success",
  "message": "Self-study attendance submitted",
  "record_id": 789
}

Error Response (422):
{
  "status": "error",
  "message": "Period must be 1 or 4 (self-study periods)"
}
```

### 3.4 Get Attendance Record
```
POST /attendance/record
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "record_id": 456
}

Success Response (200):
{
  "status": "success",
  "record": {
    "record_id": 456,
    "timetable_roster_id": 123,
    "submitted_by": 42,
    "is_submitted": true,
    "submitted_at": "2024-12-17T10:30:00Z",
    "attendance_items": [
      {"student_id": 1, "is_present": true, "is_sick": false}
    ]
  }
}
```

### 3.5 Get Student Attendance History
```
POST /attendance/student-history
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "student_id": 1,
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "history": [
    {
      "date": "2024-12-17",
      "course": "Mathematics",
      "is_present": true,
      "is_sick": false
    }
  ]
}
```

---

## 4. Health & Incident Management Routes

### 4.1 Record Sick Student (Nurse Only - Role 4)
```
POST /health/record-sick
Authorization: Bearer <NURSE_TOKEN>
Content-Type: application/json

Request:
{
  "student_id": 5,
  "illness_type": "fever"
}

Success Response (200):
{
  "status": "success",
  "message": "Student marked as sick",
  "affected_classes": 3,
  "notifications_sent": 3
}
```

### 4.2 Mark Student as Healed (Nurse Only - Role 4)
```
POST /health/mark-healed
Authorization: Bearer <NURSE_TOKEN>
Content-Type: application/json

Request:
{
  "student_id": 5
}

Success Response (200):
{
  "status": "success",
  "message": "Student marked as healed",
  "notifications_sent": 3
}
```

### 4.3 Log Incident (Discipline Only - Role 3)
```
POST /health/log-incident
Authorization: Bearer <DISCIPLINE_TOKEN>
Content-Type: application/json

Request:
{
  "student_id": 10,
  "incident_type": "medical",
  "description": "Went home with parent due to fever"
}

Success Response (201):
{
  "status": "success",
  "message": "Incident logged successfully",
  "incident_id": 1
}
```

### 4.4 Get Incidents (Discipline or Nurse - Roles 3, 4)
```
POST /health/incidents
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "incidents": [
    {
      "incident_id": 1,
      "student_id": 10,
      "student_name": "Alice Kalisa",
      "incident_type": "medical",
      "description": "Went home with parent due to fever",
      "created_at": "2024-12-17T10:30:00Z"
    }
  ]
}
```

### 4.5 Get Sick Student Count (Nurse Only - Role 4)
```
POST /health/sick-count
Authorization: Bearer <NURSE_TOKEN>

Success Response (200):
{
  "status": "success",
  "sick_count": 5,
  "total_students": 42
}
```

---

## 5. Reporting Routes

### 5.1 Get Attendance Overview
```
POST /report/overview
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "date": "2024-12-17"
}

Success Response (200):
{
  "status": "success",
  "overview": {
    "present": 280,
    "absent": 45,
    "sick": 15,
    "total": 340,
    "attendance_rate": 82.35
  }
}
```

### 5.2 Get Attendance by Class
```
POST /report/by-class
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "by_class": [
    {
      "class_id": 1,
      "class_name": "YA",
      "present": 450,
      "absent": 50,
      "sick": 20,
      "total": 520
    }
  ]
}
```

### 5.3 Get Teacher Report (Teacher Only - Role 2)
```
POST /report/teacher
Authorization: Bearer <TEACHER_TOKEN>
Content-Type: application/json

Request:
{
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "report": {
    "teacher_id": 42,
    "teacher_name": "John Doe",
    "classes": [
      {
        "class_name": "YA",
        "present": 450,
        "absent": 50,
        "sick": 20
      }
    ]
  }
}
```

### 5.4 Get Self-Study Report (Discipline Only - Role 3)
```
POST /report/selfstudy
Authorization: Bearer <DISCIPLINE_TOKEN>
Content-Type: application/json

Request:
{
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "selfstudy_report": {
    "period_1": {"present": 300, "absent": 40},
    "period_4": {"present": 310, "absent": 30}
  }
}
```

### 5.5 Get Health Statistics (Nurse Only - Role 4)
```
POST /report/health
Authorization: Bearer <NURSE_TOKEN>
Content-Type: application/json

Request:
{
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "health_stats": {
    "sick_trend": [
      {"date": "2024-12-17", "sick_count": 5, "total": 340}
    ],
    "recovery_rate": 85.5,
    "illness_breakdown": {
      "fever": 12,
      "cold": 8,
      "headache": 5
    }
  }
}
```

### 5.6 Get Top Absent Students
```
POST /report/top-absent
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "start_date": "2024-12-01",
  "end_date": "2024-12-31",
  "limit": 10
}

Success Response (200):
{
  "status": "success",
  "top_absent": [
    {"student_id": 1, "name": "John Doe", "absences": 15},
    {"student_id": 2, "name": "Jane Smith", "absences": 12}
  ]
}
```

### 5.7 Get Student Details
```
POST /report/student-details
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "student_id": 1,
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "student": {
    "student_id": 1,
    "name": "John Doe",
    "class": "YA",
    "total_days": 20,
    "present": 18,
    "absent": 2,
    "sick": 0,
    "attendance_rate": 90.0
  }
}
```

### 5.8 Get Chart Data
```
POST /report/chart-data
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "chart_type": "daily_attendance",
  "start_date": "2024-12-01",
  "end_date": "2024-12-31"
}

Success Response (200):
{
  "status": "success",
  "chart_data": {
    "labels": ["2024-12-01", "2024-12-02"],
    "present": [280, 285],
    "absent": [45, 40],
    "sick": [15, 15]
  }
}
```

---

## 6. Dashboard Routes

### 6.1 Admin Dashboard (Admin Only - Role 1)
```
GET /dashboard/admin
Authorization: Bearer <ADMIN_TOKEN>

Success Response (200):
{
  "status": "success",
  "dashboard": {
    "attendance_overview": {
      "present": 280,
      "absent": 45,
      "sick": 15,
      "attendance_rate": 82.35
    },
    "class_stats": {
      "total_classes": 12,
      "total_students": 340,
      "active_classes": 12
    },
    "user_stats": {
      "total_admins": 2,
      "total_teachers": 15,
      "total_nurses": 3,
      "total_discipline": 2
    },
    "timetable_status": {
      "active_timetable": 15,
      "pending_submissions": 5
    },
    "recent_activities": []
  }
}
```

### 6.2 Teacher Dashboard (Teacher Only - Role 2)
```
POST /dashboard/teacher
Authorization: Bearer <TEACHER_TOKEN>

Success Response (200):
{
  "status": "success",
  "dashboard": {
    "today_schedule": [
      {
        "roster_id": 123,
        "course": "Mathematics",
        "class": "YA",
        "period": 1,
        "time": "08:00-09:00"
      }
    ],
    "pending_attendance": 2,
    "pending_submissions": [
      {"course": "Mathematics", "class": "YA", "period": 1}
    ],
    "recent_notifications": []
  }
}
```

### 6.3 Discipline Dashboard (Discipline Only - Role 3)
```
POST /dashboard/discipline
Authorization: Bearer <DISCIPLINE_TOKEN>

Success Response (200):
{
  "status": "success",
  "dashboard": {
    "pending_selfstudy": 5,
    "recent_incidents": [
      {
        "incident_id": 1,
        "student_name": "John Doe",
        "incident_type": "medical",
        "created_at": "2024-12-17T10:30:00Z"
      }
    ],
    "today_selfstudy_count": 340
  }
}
```

### 6.4 Nurse Dashboard (Nurse Only - Role 4)
```
POST /dashboard/nurse
Authorization: Bearer <NURSE_TOKEN>

Success Response (200):
{
  "status": "success",
  "dashboard": {
    "sick_students_today": 5,
    "health_stats": {
      "sick_trend": [],
      "recovery_rate": 85.5
    },
    "recent_sick_students": [
      {"student_id": 5, "name": "Alice Kalisa", "illness": "fever"}
    ]
  }
}
```

---

## Role IDs

| Role ID | Name | Description |
|---------|------|-------------|
| 1 | Admin | Full system access, manages timetables and users |
| 2 | Teacher | Records course attendance |
| 3 | Discipline Staff | Records self-study attendance and incidents |
| 4 | School Nurse | Records student sickness and health incidents |
| 5 | Unverified | Pending approval |
| 6 | Registrar | Manages student imports and class roster |

---

## Common Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Description of error",
  "code": 400,
  "errors": { }
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Server Error |

---

## Authentication

All routes except `/signup` and `/login` require:

```
Authorization: Bearer <JWT_TOKEN>
```

Obtain token by calling `/login` endpoint.

---

## Rate Limiting

No rate limiting currently implemented. For production, configure:
- IP-based rate limiting
- User-based rate limiting
- Endpoint-specific limits

---

## API Base URL

```
http://localhost:8000
or
https://rcaspire.example.com
```

---

**Last Updated**: December 17, 2025


