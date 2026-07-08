# API Documentation

**Base URL:** `http://localhost:5000/api`

**Authentication:** Bearer token in `Authorization` header or `token` cookie.

---

## Authentication

### Register
```
POST /auth/register
```
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "candidate"
}
```

### Login
```
POST /auth/login
```
```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "candidate"
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

### Update Profile
```
PUT /auth/profile
```
```json
{
  "name": "John Doe",
  "phone": "+1-555-0100",
  "location": "New York",
  "bio": "Developer",
  "skills": ["JavaScript", "React"],
  "darkMode": false
}
```

### Forgot Password
```
POST /auth/forgot-password
```
```json
{ "email": "john@example.com" }
```

### Reset Password
```
PUT /auth/reset-password/:token
```
```json
{ "password": "newpassword123" }
```

### Verify Email
```
GET /auth/verify/:token
```

### Logout
```
POST /auth/logout
```

---

## Resumes (Candidate)

### Upload Resume
```
POST /resumes/upload
Content-Type: multipart/form-data
Field: resume (file)
```

### Get All Resumes
```
GET /resumes
```

### Get Resume
```
GET /resumes/:id
```

### Simulate Resume
```
POST /resumes/:id/simulate
```
```json
{ "scenarios": ["FAANG", "Startup", "Enterprise"] }
```

### Dynamic Resume
```
POST /resumes/:id/dynamic
```
```json
{ "job": { "title": "Senior Developer" } }
```

### Improvement Report
```
GET /resumes/:id/improvement
```

### Resume Timeline
```
GET /resumes/:id/timeline
```

---

## Jobs

### List Jobs
```
GET /jobs?search=engineer&status=active&page=1&limit=10
```

### Get Job
```
GET /jobs/:id
```

### Create Job (Recruiter)
```
POST /jobs
```
```json
{
  "title": "Senior Developer",
  "company": "<companyId>",
  "description": "Job description",
  "skills": ["JavaScript", "React"],
  "location": "Remote",
  "type": "full-time"
}
```

### AI Generate Job (Recruiter)
```
POST /jobs/ai/generate
```
```json
{
  "prompt": "Senior full-stack developer with React",
  "company": "<companyId>"
}
```

### Update Job (Recruiter)
```
PUT /jobs/:id
```

### Delete Job (Recruiter)
```
DELETE /jobs/:id
```

### Apply to Job (Candidate)
```
POST /jobs/:id/apply
```
```json
{ "resumeId": "<resumeId>" }
```

### Rank Candidates (Recruiter)
```
GET /jobs/:jobId/rankings
```

### Reverse Match (Recruiter)
```
POST /jobs/:id/reverse-match
```

---

## Applications

### List Applications
```
GET /applications
```

### Update Application
```
PUT /applications/:id
```
```json
{
  "status": "shortlisted",
  "note": "Strong candidate",
  "interviewDate": "2026-07-15T10:00:00Z"
}
```

**Status values:** `applied`, `screening`, `shortlisted`, `interview`, `offer`, `rejected`, `withdrawn`

---

## AI Endpoints

### GitHub

```
POST /ai/github/connect     { "username": "devuser" }
GET  /ai/github/profile
POST /ai/github/sync
```

### Career Roadmap

```
GET  /ai/roadmap
PUT  /ai/roadmap            { nodes: [], connections: [] }
GET  /ai/roadmap/analyze
GET  /ai/leaderboard
GET  /ai/benchmarks
GET  /ai/career-growth
GET  /ai/learning-score
GET  /ai/learning-roadmap
GET  /ai/job-recommendations
```

### Assessments

```
POST /ai/assessments        { "language": "JavaScript", "difficulty": "medium" }
GET  /ai/assessments
POST /ai/assessments/:id/submit   { "code": "function solve() {}" }
```

### AI Tools

```
POST /ai/interview-questions   { "role": "Developer", "skills": ["JS"], "count": 10 }
POST /ai/candidate-ai            { "action": "interview-prep", "context": {} }
POST /ai/recruiter-assistant     { "query": "Who should I interview?", "context": {} }
GET  /ai/hiring-analytics
POST /ai/schedule-interview      { "participants": [] }
POST /ai/project-knowledge       { "project": "repo-name", "question": "architecture?" }
POST /ai/company-goals           { "company": "TechCorp", "goals": ["Hire 10 engineers"] }
GET  /ai/soft-skills
POST /ai/explain-score           { "score": 85, "context": {} }
```

---

## Admin Endpoints

### Search
```
GET /search?q=developer
```

### Notifications
```
GET  /notifications
PUT  /notifications/:id/read
```

### Users (Admin)
```
GET    /users?search=john&role=candidate&page=1
PUT    /users/:id
DELETE /users/:id
```

### Companies (Admin)
```
GET  /companies
POST /companies    { "name": "TechCorp", "industry": "Technology" }
PUT  /companies/:id
```

### Platform
```
GET /stats
GET /logs
GET /settings
PUT /settings    { "settings": [{ "key": "OPENAI_API_KEY", "value": "sk-...", "category": "api", "isSecret": true }] }
```

---

## Response Format

### Success
```json
{
  "success": true,
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

### Validation Error
```json
{
  "success": false,
  "errors": [{ "msg": "Invalid email", "param": "email" }]
}
```

---

## AI Module Reference

| # | Module | Endpoint |
|---|--------|----------|
| 1 | AI Resume Screening | `POST /jobs/:id/apply` (auto) |
| 2 | Resume Parsing | `POST /resumes/upload` |
| 3 | Semantic Skill Matching | `POST /jobs/:id/apply` (auto) |
| 4 | Candidate Ranking | `GET /jobs/:jobId/rankings` |
| 5 | Explainable AI Scoring | `POST /ai/explain-score` |
| 6 | Dynamic Resume | `POST /resumes/:id/dynamic` |
| 7 | Resume Simulation | `POST /resumes/:id/simulate` |
| 8 | Authenticity Checker | `POST /resumes/upload` (auto) |
| 9 | Resume Timeline | `GET /resumes/:id/timeline` |
| 10 | Improvement Report | `GET /resumes/:id/improvement` |
| 11 | GitHub Repo Ranking | `POST /ai/github/connect` |
| 12 | Contribution Analyzer | `POST /ai/github/connect` |
| 13 | Portfolio Score | `GET /ai/github/profile` |
| 14 | Project Quality Analyzer | `POST /ai/github/connect` |
| 15 | Project Knowledge | `POST /ai/project-knowledge` |
| 16 | Skill Transfer | `GET /ai/soft-skills` |
| 17 | Coding Assessment | `POST /ai/assessments` |
| 18 | AI Code Review | `POST /ai/assessments/:id/submit` |
| 19 | Interview Questions | `POST /ai/interview-questions` |
| 20 | Soft Skill Inference | `GET /ai/soft-skills` |
| 21 | Career Roadmap | `GET /ai/roadmap` |
| 22 | Roadmap Analyzer | `GET /ai/roadmap/analyze` |
| 23 | Company Goal Planner | `POST /ai/company-goals` |
| 24 | Career Leaderboard | `GET /ai/leaderboard` |
| 25 | Benchmark Comparison | `GET /ai/benchmarks` |
| 26 | Learning Roadmap | `GET /ai/learning-roadmap` |
| 27 | Career Growth Predictor | `GET /ai/career-growth` |
| 28 | Continuous Learning Score | `GET /ai/learning-score` |
| 29 | Recruiter Assistant | `POST /ai/recruiter-assistant` |
| 30 | Job Recommendation | `GET /ai/job-recommendations` |
| 31 | Reverse Matching | `POST /jobs/:id/reverse-match` |
| 32 | Auto Resume Collection | Placeholder in AI service |
| 33 | Hiring Analytics | `GET /ai/hiring-analytics` |
| 34 | Interview Scheduling | `POST /ai/schedule-interview` |
| 35 | Application Tracking | `GET /applications` |

---

## Rate Limiting

- 200 requests per 15 minutes per IP on `/api/*`

## File Upload

- Max size: 10MB
- Allowed types: `.pdf`, `.doc`, `.docx`
- Storage: `public/uploads/`
