# AI-Powered Intelligent Recruitment & Technical Talent Evaluation Platform

A production-ready, full-stack AI recruitment platform with premium SaaS UI, role-based dashboards, and 35+ AI modules with placeholder integrations.

![Tech Stack](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Database-green) ![JWT](https://img.shields.io/badge/Auth-JWT-blue)

## Features

### Authentication
- Candidate, Recruiter, and Admin login
- JWT authentication with secure cookies
- Role-based access control (RBAC)
- Forgot password & email verification
- bcrypt password hashing

### Candidate Dashboard
- Profile management & resume upload/parsing
- Application tracking with AI scores
- Resume simulation, dynamic resume, improvement reports
- Career roadmap (interactive visual graph)
- Learning progress, leaderboard, benchmarks
- Career growth prediction
- GitHub portfolio integration
- Coding assessments & AI code review
- Interview question generator
- AI career assistant
- Job recommendations

### Recruiter Dashboard
- AI job creation & job management
- Resume screening & semantic skill matching
- Candidate ranking & search with filters
- Recruiter AI assistant
- GitHub repository analysis
- Interview scheduling
- Hiring analytics & reports
- Shortlist, reject, offer letter workflow

### Admin Dashboard
- User, recruiter, and company management
- Platform analytics & statistics
- Settings / Integrations page for API keys
- Feature toggles & subscription management
- System logs, backup, and security panel

### AI Modules (35+)
All AI features use placeholder integrations ready for OpenAI API keys:
Resume screening, parsing, semantic matching, ranking, explainable scoring, dynamic resume, simulation, authenticity checker, timeline, improvement reports, GitHub analysis, project knowledge, skill transfer, coding assessment, code review, interview questions, soft skill inference, career roadmap, learning roadmap, growth predictor, recruiter/candidate assistants, job matching, hiring analytics, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (SPA) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Security | Helmet, CORS, Rate Limiting, CSRF, Input Validation |
| Charts | Chart.js |

## Project Structure

```
├── client/                 # Frontend SPA
│   ├── css/               # Styles (main, animations, dashboard)
│   ├── js/                # JavaScript modules
│   │   ├── api.js         # API client
│   │   ├── components.js  # Reusable UI components
│   │   ├── charts.js      # Chart.js wrappers
│   │   ├── roadmap.js     # Career roadmap visualizer
│   │   ├── router.js      # Hash-based SPA router
│   │   └── pages/         # Dashboard page modules
│   └── index.html
├── server/
│   └── index.js           # Express server entry
├── config/                # Environment configuration
├── database/              # DB connection & seed script
├── models/                # Mongoose models
├── routes/                # Express routes
├── controllers/           # Route controllers
├── middleware/            # Auth, validation, upload, logging
├── services/              # AI service layer (placeholders)
├── utils/                 # Token, email, crypto utilities
├── public/uploads/        # Resume file uploads
├── .env.example           # Environment variable template
└── docs/API.md            # API documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Seed database with sample data
npm run seed

# Start server
npm run dev
```

Open **http://localhost:5000** in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@recruitment.com | admin123 |
| Recruiter | recruiter@techvision.com | recruiter123 |
| Candidate | alex@example.com | candidate123 |

The app also runs with a built-in fallback data store when MongoDB is not available locally, so the demo remains functional out of the box.

## Configuration

All secrets are managed via environment variables. Configure them in `.env` or through the **Admin → Integrations** page:

- `OPENAI_API_KEY` — OpenAI for AI features
- `GITHUB_CLIENT_ID/SECRET` — GitHub OAuth
- `GOOGLE_CLIENT_ID/SECRET` — Google OAuth
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `SMTP_*` — Email configuration

See `.env.example` for the complete list.

## API Documentation

Full REST API documentation is available at [docs/API.md](docs/API.md).

Base URL: `http://localhost:5000/api`

## Security

- JWT token authentication
- Helmet security headers
- Rate limiting (200 req/15min)
- CORS with credentials
- Input validation (express-validator)
- Password hashing (bcrypt, 12 rounds)
- CSRF protection ready
- Secure HTTP-only cookies

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (hot reload) |
| `npm run seed` | Seed database with sample data |

## License

MIT
