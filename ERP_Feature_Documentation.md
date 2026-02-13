# ERP System - Feature Documentation

## Overview
The ERP System is a comprehensive Enterprise Resource Planning application designed for managing machinery, inventory, maintenance, procurement, and site operations. It's built with a Node.js/Express backend and React frontend, featuring role-based access control and comprehensive business process management.

## Core Features

### 1. User Management & Authentication
- **User Registration & Authentication**: Secure JWT-based authentication system with role-based access control
- **Role-Based Permissions**: Six distinct user roles with specific permissions:
  - Admin
  - Mechanical Head
  - Mechanical Manager
  - Site Incharge
  - Store Manager
  - Project Manager
- **User Profiles**: Complete user profiles with personal information, department assignments, and site affiliations
- **Password Security**: Bcrypt encryption for password security

### 2. Site Management
- **Site Creation & Management**: Create and manage multiple physical and virtual sites
- **Site Codes**: Automatic generation of site codes (e.g., SITE-001)
- **Site Status Tracking**: Sites can be active, closed, or paused
- **Site Assignment**: Users can be assigned to specific sites with location-specific access

### 3. Machinery Management
- **Comprehensive Machine Records**: Track all machinery with detailed information:
  - ERP codes (auto-generated as ERP-XXXX)
  - Registration numbers
  - Machine numbers and codes
  - Chassis and engine numbers
  - Serial numbers
  - Model and make information
  - Year of manufacture (YOM)
  - Purchase date
  - Capacity specifications
  - Owner information
- **Machine Documentation**: Upload and store various machine documents:
  - Fitness certificates with expiry tracking
  - Pollution certificates with expiry tracking
  - Insurance documents with expiry tracking
  - Permit files with expiry tracking
  - Motor vehicle tax documents
  - Machine images
- **Machine Status Tracking**: Track machine status as:
  - Idle
  - In Use
  - In Transfer
  - Sold
  - Scrap
- **Machine Categories**: Organize machines by primary and machine categories

### 4. Inventory Management
- **Site-Based Inventory**: Track inventory levels at specific sites
- **Stock Levels**: Monitor current stock, minimum levels, and stock status
- **Inventory Alerts**: Automated alerts for low stock and out-of-stock items
- **Stock Logging**: Complete audit trail of stock movements

### 5. Requisition Management
- **Material Requisition System**: Create and manage material requisitions with:
  - Auto-generated requisition numbers (e.g., REQ-XXXX)
  - Request priority levels (High/Medium/Low)
  - Due date tracking
  - Multi-level approval workflow (PM and HO approval)
- **Requisition Status Tracking**: Track requisitions through:
  - Pending
  - Approved
  - Received
  - Completed
  - Rejected
- **Requisition Items**: Associate multiple items with each requisition

### 6. Procurement Management
- **Procurement Tracking**: Link procurements to requisitions
- **Vendor Management**: Track vendor information and relationships
- **Procurement Lifecycle**: Complete procurement workflow from request to delivery

### 7. Material Issue Management
- **Material Distribution**: Track material issues from inventory to users/teams
- **Issue Documentation**: Complete records of who received what materials when
- **Requisition Linking**: Link material issues to original requisitions

### 8. Maintenance Management
- **Maintenance Logs**: Record all maintenance activities with:
  - Service dates
  - Service types
  - Costs
  - Service providers
  - Parts used
- **Scheduled Maintenance**: Plan and track upcoming maintenance activities
- **Maintenance Statistics**: Analyze maintenance patterns and costs by machine
- **Preventive Maintenance**: Schedule routine maintenance to prevent breakdowns

### 9. Machine Transfer System
- **Machine Movement Tracking**: Record transfers of machines between sites
- **Transfer History**: Complete audit trail of all machine movements
- **Transfer Documentation**: Track reasons for transfers and responsible parties
- **Status Updates**: Update machine status during transfer process

### 10. Logbook System
- **Operational Logging**: Record daily operational activities for machines
- **Activity Tracking**: Log machine usage, hours, fuel consumption, etc.
- **Performance Monitoring**: Track machine performance over time
- **Operational History**: Maintain complete operational history for each machine

### 11. Dashboard & Analytics
- **Executive Dashboard**: Comprehensive overview with:
  - Machine status summaries
  - Site activity summaries
  - Requisition and procurement status
  - Inventory alerts
  - Maintenance due notifications
  - Outstanding payments
  - Monthly expense tracking
- **Site-Specific Dashboards**: Role-based dashboards showing only relevant site information
- **Alert System**: Real-time notifications for critical events:
  - Low inventory levels
  - Expired documents
  - Due maintenance
  - Pending approvals
- **Recent Activities**: Track recent system activities and changes

### 12. Notification System
- **Real-time Notifications**: Push notifications for important events
- **Read Status Tracking**: Track which notifications have been read by users
- **Role-Based Notifications**: Target notifications to specific user roles
- **Notification History**: Maintain archive of past notifications

### 13. Item & Category Management
- **Item Groups**: Organize items into logical groups
- **Item Management**: Detailed item tracking with:
  - Item codes
  - Specifications
  - Units of measure
- **Unit Management**: Define and manage measurement units
- **Category Hierarchy**: Organize items with primary and machine categories

### 14. Reporting System
- **Custom Reports**: Generate reports on various business metrics
- **Inventory Reports**: Stock levels, movement history, and reorder alerts
- **Maintenance Reports**: Service history, costs, and performance metrics
- **Procurement Reports**: Spending analysis and vendor performance
- **Machine Reports**: Utilization, performance, and cost analysis

### 15. File Management
- **Document Upload**: Upload and store various document types
- **Cloud Storage**: Integration with Cloudinary for file storage
- **Document Expiry Tracking**: Monitor document expiry dates
- **File Organization**: Organize files by category and machine

### 16. Invoice & Payment Management
- **Invoice Generation**: Create and manage invoices
- **Payment Tracking**: Track payment status and outstanding amounts
- **Financial Reporting**: Monitor cash flow and payment trends

### 17. Security Features
- **API Rate Limiting**: Protect against abuse with rate limiting
- **CORS Configuration**: Secure cross-origin resource sharing
- **Helmet Security**: Implement various security headers
- **Input Validation**: Comprehensive request validation
- **Soft Deletes**: Maintain data integrity with soft deletion

### 18. Automation & Cron Jobs
- **Scheduled Tasks**: Automated tasks for system maintenance
- **Data Refresh**: Regular updates of external data
- **Health Checks**: Regular system health monitoring

## Technical Architecture

### Backend
- **Framework**: Node.js with Express
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens
- **File Storage**: Cloudinary integration
- **Task Scheduling**: node-cron
- **Logging**: Winston logger
- **Security**: Helmet, rate limiting, CORS

### Frontend
- **Framework**: React with Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **UI Components**: Custom component library
- **Styling**: Tailwind CSS
- **Notifications**: Toast notifications

## Business Benefits

### Operational Efficiency
- Centralized management of machinery and inventory
- Automated workflows for requisitions and procurement
- Real-time visibility into machine status and availability

### Cost Management
- Preventive maintenance reduces breakdown costs
- Inventory optimization prevents stockouts and overstocking
- Automated document expiry tracking prevents penalties

### Compliance & Safety
- Complete audit trails for all operations
- Document expiry monitoring ensures compliance
- Maintenance tracking ensures safety standards

### Decision Making
- Comprehensive reporting and analytics
- Real-time dashboards for quick insights
- Historical data for trend analysis

This ERP system is designed to streamline operations in industrial/machinery management environments, providing comprehensive tools for tracking assets, managing maintenance, controlling inventory, and optimizing operational processes.
