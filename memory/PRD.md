# ProCon PMS - Project Management System PRD

## Overview
Construction Project Management System for aluminum/steel fabrication, interior design, construction, and renovation projects.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Authentication**: JWT-based

## User Personas & Roles
1. **Admin/Finance** - Full system control, user management, approvals
2. **Project Manager** - Project-level control, task/resource assignment
3. **Sales Agent/Partner** - View own projects, track commissions
4. **Site Supervisor/Fabricator** - Operational access, progress logging
5. **B2B/Residential Client** - Portal-only view access

## Core Requirements (Static)
- Role-based authentication and access control
- Project lifecycle management (Planning → Handover → Closed)
- Interactive Gantt charts
- Document management with versioning
- Financial tracking (Budget, Invoices, Payments)
- Change order management
- Progress logging with photo uploads
- Real-time messaging
- Reports and analytics

## What's Been Implemented (Feb 7, 2026)
- [x] JWT Authentication with role-based access
- [x] Dashboard with KPIs (Projects, Budget, Pending, Overdue)
- [x] Project CRUD with service types
- [x] Task/Milestone management
- [x] Custom Gantt chart visualization
- [x] Document upload with approval workflow
- [x] Financial entries (Invoice, Payment, Variation)
- [x] Change orders with approval flow
- [x] Progress logs with photo upload
- [x] Real-time messaging per project
- [x] Reports with charts (Recharts)
- [x] User Management (Admin only)
- [x] White background with red accent theme
- [x] Glowing button effects
- [x] Mobile-responsive design

## Default Credentials
- Email: admin@pms.com
- Password: Admin@123

## Prioritized Backlog

### P0 (Critical)
- ✅ All core features implemented

### P1 (High Priority)
- Email notification integration
- Commission tracking integration
- File storage cloud migration (S3)
- Advanced Gantt with drag-drop

### P2 (Medium Priority)
- Client portal with payment links
- Advanced reporting exports (PDF, Excel)
- Material tracking
- Resource leveling

### P3 (Future)
- Mobile app
- AI-powered project insights
- Integration with accounting software
- Multi-language support

## Next Tasks
1. Add email notifications for approvals
2. Implement commission calculation triggers
3. Add export functionality for reports
4. Enhance Gantt with dependency editing
