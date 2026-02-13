# SaaS Conversion Plan for ERP Application

## Overview
This document outlines the comprehensive plan to convert the current single-tenant ERP application to a multi-tenant SaaS application with subscription-based billing and complete data isolation between tenants.

## Current Architecture Analysis
- **Backend**: Node.js/Express with PostgreSQL and Sequelize ORM
- **Frontend**: React with Vite, Redux Toolkit, Tailwind CSS
- **Database**: Single PostgreSQL database with various ERP modules
- **Authentication**: JWT-based with role-based access control
- **Features**: Machinery management, inventory, procurement, maintenance, etc.

## Goals
1. Implement multi-tenant architecture with data isolation
2. Add subscription-based billing system
3. Enable monthly recurring payments
4. Maintain data privacy between different companies
5. Provide scalable infrastructure for multiple tenants

## Phase 1: Database Schema Modifications

### 1.1 Create Tenant Management Tables

```sql
-- Tenant table to represent each company
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) UNIQUE,
  domain VARCHAR(255) UNIQUE,
  company_logo_url TEXT,
  brand_color VARCHAR(7), -- hex color code
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
  trial_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans table
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL, -- monthly, annual
  max_users INTEGER,
  max_sites INTEGER,
  max_machines INTEGER,
 features JSONB, -- JSON object containing feature flags
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'trial', -- trial, active, expired, cancelled
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  payment_method_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing history table
CREATE TABLE billing_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
 subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- pending, paid, failed, refunded
  invoice_number VARCHAR(50) UNIQUE,
  payment_date TIMESTAMP,
  due_date TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Modify Existing Tables to Include Tenant Context

Add tenant_id to all existing tables:

```sql
-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to sites table
ALTER TABLE sites ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to machinery table
ALTER TABLE machinery ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to items table
ALTER TABLE items ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to item_groups table
ALTER TABLE item_groups ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to units table
ALTER TABLE units ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to requisitions table
ALTER TABLE requisitions ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to procurement table
ALTER TABLE procurement ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to invoices table
ALTER TABLE invoices ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to vendors table
ALTER TABLE vendors ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to maintenance logs table
ALTER TABLE maintenance_logs ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to scheduled_maintenance table
ALTER TABLE scheduled_maintenance ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to machine_transfers table
ALTER TABLE machine_transfers ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to logbook_entries table
ALTER TABLE logbook_entries ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to material_issues table
ALTER TABLE material_issues ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to notifications table
ALTER TABLE notifications ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to departments table
ALTER TABLE departments ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to roles table
ALTER TABLE roles ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to primary_categories table
ALTER TABLE primary_categories ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to machine_categories table
ALTER TABLE machine_categories ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to stock_logs table
ALTER TABLE stock_logs ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to site_inventory table
ALTER TABLE site_inventory ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to payments table
ALTER TABLE payments ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Add tenant_id to machinery_item_codes table
ALTER TABLE machinery_item_codes ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
```

### 1.3 Create Indexes for Performance

```sql
-- Create indexes for tenant-based queries
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_sites_tenant_id ON sites(tenant_id);
CREATE INDEX idx_machinery_tenant_id ON machinery(tenant_id);
CREATE INDEX idx_items_tenant_id ON items(tenant_id);
CREATE INDEX idx_item_groups_tenant_id ON item_groups(tenant_id);
CREATE INDEX idx_units_tenant_id ON units(tenant_id);
CREATE INDEX idx_requisitions_tenant_id ON requisitions(tenant_id);
CREATE INDEX idx_procurement_tenant_id ON procurement(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX idx_maintenance_logs_tenant_id ON maintenance_logs(tenant_id);
CREATE INDEX idx_scheduled_maintenance_tenant_id ON scheduled_maintenance(tenant_id);
CREATE INDEX idx_machine_transfers_tenant_id ON machine_transfers(tenant_id);
CREATE INDEX idx_logbook_entries_tenant_id ON logbook_entries(tenant_id);
CREATE INDEX idx_material_issues_tenant_id ON material_issues(tenant_id);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_primary_categories_tenant_id ON primary_categories(tenant_id);
CREATE INDEX idx_machine_categories_tenant_id ON machine_categories(tenant_id);
CREATE INDEX idx_stock_logs_tenant_id ON stock_logs(tenant_id);
CREATE INDEX idx_site_inventory_tenant_id ON site_inventory(tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_machinery_item_codes_tenant_id ON machinery_item_codes(tenant_id);
```

## Phase 2: Backend Implementation

### 2.1 Create Tenant Model

```javascript
// backend/models/Tenant.js
module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    "Tenant",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subdomain: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      companyLogoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      brandColor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "suspended", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      trialEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "tenants",
      timestamps: true,
      paranoid: true,
      hooks: {
        beforeCreate: (tenant, options) => {
          tenant.createdAt = new Date();
          tenant.updatedAt = new Date();
        },
        beforeUpdate: (tenant, options) => {
          tenant.updatedAt = new Date();
        },
      },
    }
  );

  Tenant.associate = (models) => {
    Tenant.hasMany(models.Subscription, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.BillingHistory, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.User, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Site, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Machinery, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Item, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.ItemGroup, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Unit, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Requisition, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Procurement, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Invoice, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Vendor, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.MaintenanceLog, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.ScheduledMaintenance, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.MachineTransfer, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.LogbookEntry, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.MaterialIssue, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Notification, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Department, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Role, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.PrimaryCategory, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.MachineCategory, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.StockLog, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.SiteInventory, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.Payment, { foreignKey: "tenant_id" });
    Tenant.hasMany(models.MachineryItemCode, { foreignKey: "tenant_id" });
  };

  return Tenant;
};
```

### 2.2 Create Subscription Models

```javascript
// backend/models/SubscriptionPlan.js
module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define(
    "SubscriptionPlan",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      billingCycle: {
        type: DataTypes.ENUM("monthly", "annual"),
        allowNull: false,
      },
      maxUsers: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maxSites: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maxMachines: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      features: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "subscription_plans",
      timestamps: true,
      paranoid: true,
    }
  );

  SubscriptionPlan.associate = (models) => {
    SubscriptionPlan.hasMany(models.Subscription, { foreignKey: "plan_id" });
  };

  return SubscriptionPlan;
};

// backend/models/Subscription.js
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
      },
      planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "subscription_plans",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("trial", "active", "expired", "cancelled"),
        defaultValue: "trial",
      },
      startDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nextBillingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentMethodId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "subscriptions",
      timestamps: true,
      paranoid: true,
    }
  );

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Tenant, { foreignKey: "tenantId" });
    Subscription.belongsTo(models.SubscriptionPlan, { foreignKey: "planId" });
    Subscription.hasMany(models.BillingHistory, { foreignKey: "subscription_id" });
 };

  return Subscription;
};

// backend/models/BillingHistory.js
module.exports = (sequelize, DataTypes) => {
  const BillingHistory = sequelize.define(
    "BillingHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
      },
      subscriptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "subscriptions",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "USD",
      },
      status: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
        allowNull: false,
      },
      invoiceNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "billing_history",
      timestamps: true,
      paranoid: true,
    }
  );

  BillingHistory.associate = (models) => {
    BillingHistory.belongsTo(models.Tenant, { foreignKey: "tenantId" });
    BillingHistory.belongsTo(models.Subscription, { foreignKey: "subscriptionId" });
  };

  return BillingHistory;
};
```

### 2.3 Update All Existing Models to Include Tenant Association

```javascript
// Example for User model - all other models need similar updates
// backend/models/User.js
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
          this.setDataValue(
            "password",
            bcrypt.hashSync(value, bcrypt.genSaltSync(10))
          );
        },
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "archived"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "users",
      timestamps: true,
      paranoid: true,
      hooks: {
        afterCreate: async (user, options) => {
          const newCode = `EMP-${String(user.id).padStart(3, "0")}`;
          await user.update(
            { code: newCode },
            { transaction: options.transaction }
          );
        },
      },
    }
  );
  
  User.prototype.validPassword = async function (password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      return false;
    }
  };

  User.hashPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  };

  User.associate = (models) => {
    User.belongsTo(models.Tenant, { foreignKey: "tenantId" });
    User.belongsTo(models.Role, { foreignKey: "roleId" });
    User.belongsTo(models.Department, { foreignKey: "departmentId" });
    User.belongsTo(models.Site, { foreignKey: "siteId" });
    User.belongsToMany(models.Notification, {
      through: models.NotificationReadStatus,
      foreignKey: "userId",
    });
  };
  
  return User;
};
```

### 2.4 Create Tenant Middleware

```javascript
// backend/middlewares/tenantMiddleware.js
const Tenant = require("../models").Tenant;
const Subscription = require("../models").Subscription;

const tenantMiddleware = async (req, res, next) => {
  try {
    // Extract tenant identifier from request
    let tenantId = null;
    
    // Check for tenant in different places
    if (req.headers["x-tenant-id"]) {
      tenantId = req.headers["x-tenant-id"];
    } else if (req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
    } else {
      // Try to get tenant from subdomain
      const host = req.get('host');
      if (host) {
        const subdomain = host.split('.')[0];
        const tenant = await Tenant.findOne({
          where: { subdomain: subdomain, status: 'active' }
        });
        
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant identifier is required"
      });
    }

    // Verify tenant exists and is active
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant || tenant.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: "Tenant not found or inactive"
      });
    }

    // Check subscription status
    const subscription = await Subscription.findOne({
      where: { 
        tenantId: tenantId,
        status: { [Op.in]: ['active', 'trial'] }
      },
      include: [{ model: SubscriptionPlan }]
    });

    if (!subscription) {
      return res.status(402).json({
        success: false,
        message: "Subscription is required or has expired"
      });
    }

    // Add tenant info to request
    req.tenant = tenant;
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = tenantMiddleware;
```

### 2.5 Update Existing Middleware and Services

```javascript
// Update tokenValidator middleware to include tenant context
// backend/middlewares/tokenValidator.js
const jwt = require("jsonwebtoken");
const User = require("../models").User;
const Tenant = require("../models").Tenant;
const Subscription = require("../models").Subscription;
const { Op } = require("sequelize");

const tokenValidator = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Tenant, attributes: ['id', 'name', 'subdomain', 'domain'] },
        { model: require("../models").Role },
        { model: require("../models").Department },
        { model: require("../models").Site }
      ]
    });

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user inactive",
      });
    }

    // Check subscription status for the user's tenant
    const subscription = await Subscription.findOne({
      where: { 
        tenantId: user.tenantId,
        status: { [Op.in]: ['active', 'trial'] }
      }
    });

    if (!subscription) {
      return res.status(402).json({
        success: false,
        message: "Subscription is required or has expired"
      });
    }

    req.user = user;
    req.tenant = user.Tenant;
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = tokenValidator;
```

### 2.6 Update All Service Methods

```javascript
// Example for user service - all services need similar updates
// backend/src/user/user.service.js
const { User, Role, Department, Site, Tenant } = require("../../models");
const { Op } = require("sequelize");

const create = async (data) => {
  // Check if tenant has reached user limit
  const userCount = await User.count({
    where: { tenantId: data.tenantId }
  });

  const subscription = await Subscription.findOne({
    where: { tenantId: data.tenantId }
  });

  if (subscription && subscription.SubscriptionPlan.maxUsers && 
      userCount >= subscription.SubscriptionPlan.maxUsers) {
    throw new Error("User limit reached for this subscription plan");
  }

  const user = await User.create(data);
  return user;
};

const findAll = async (tenantId, options = {}) => {
  const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'DESC' } = options;
  
  const whereClause = {
    tenantId: tenantId,
    [Op.or]: [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } }
    ]
  };

  const users = await User.findAndCountAll({
    where: whereClause,
    include: [
      { model: Role },
      { model: Department },
      { model: Site }
    ],
    limit: parseInt(limit),
    offset: (page - 1) * limit,
    order: [[sortBy, sortOrder]]
  });

  return users;
};

const findById = async (id, tenantId) => {
  const user = await User.findOne({
    where: { id, tenantId },
    include: [
      { model: Role },
      { model: Department },
      { model: Site }
    ]
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const update = async (id, data, tenantId) => {
  const user = await User.findOne({
    where: { id, tenantId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  await user.update(data);
 return user;
};

const deleteById = async (id, tenantId) => {
 const user = await User.findOne({
    where: { id, tenantId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  await user.destroy();
  return { message: "User deleted successfully" };
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  deleteById
};
```

### 2.7 Create Tenant Registration and Subscription Endpoints

```javascript
// backend/src/tenant/tenant.controller.js
const { Tenant, User, Subscription, SubscriptionPlan } = require("../../models");
const { generateHash } = require("../../utils/password");
const { generateToken } = require("../../utils/jwt");
const { Op } = require("sequelize");

const registerTenant = async (req, res) => {
  try {
    const { name, email, password, subdomain, planId } = req.body;

    // Check if subdomain is available
    const existingTenant = await Tenant.findOne({
      where: { subdomain }
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: "Subdomain already taken"
      });
    }

    // Create tenant
    const tenant = await Tenant.create({
      name,
      subdomain,
      status: "active"
    });

    // Create admin user
    const hashedPassword = generateHash(password);
    const adminUser = await User.create({
      tenantId: tenant.id,
      name: "Admin User",
      email,
      password: hashedPassword,
      roleId: 1, // Assuming role 1 is admin
      status: "active"
    });

    // Create trial subscription
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan"
      });
    }

    // Calculate trial end date (e.g., 14 days)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    await Subscription.create({
      tenantId: tenant.id,
      planId: planId,
      status: "trial",
      endDate: trialEndDate
    });

    // Generate JWT token for admin user
    const token = generateToken({
      id: adminUser.id,
      tenantId: tenant.id
    });

    res.status(201).json({
      success: true,
      message: "Tenant registered successfully",
      data: {
        tenant,
        user: adminUser,
        token
      }
    });
  } catch (error) {
    console.error("Tenant registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getTenantInfo = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.tenant.id, {
      include: [
        { 
          model: Subscription,
          include: [{ model: SubscriptionPlan }]
        }
      ]
    });

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error("Get tenant info error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  registerTenant,
 getTenantInfo
};

// backend/src/tenant/tenant.routes.js
const express = require("express");
const router = express.Router();
const tenantController = require("./tenant.controller");

router.post("/register", tenantController.registerTenant);
router.get("/info", tenantController.getTenantInfo);

module.exports = router;
```

## Phase 3: Frontend Implementation

### 3.1 Update Store for Tenant Context

```javascript
// frontend/src/features/tenant/tenantSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Get tenant info
export const fetchTenantInfo = createAsyncThunk(
  'tenant/fetchInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tenant/info');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch tenant info');
    }
  }
);

const tenantSlice = createSlice({
  name: 'tenant',
  initialState: {
    info: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearTenant: (state) => {
      state.info = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenantInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenantInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.info = action.payload;
      })
      .addCase(fetchTenantInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
```

### 3.2 Update API Service for Tenant Context

```javascript
// frontend/src/services/api.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include tenant context
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or Redux store
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant context if available
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      // Subscription required - redirect to billing page
      window.location.href = '/billing';
    }
    return Promise.reject(error);
  }
);

export { api };
```

### 3.3 Create Tenant Registration Page

```jsx
// frontend/src/app/tenant-register/page.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { api } from '../../services/api';
import { setCredentials } from '../../features/auth/authSlice';

const TenantRegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subdomain: '',
    planId: 1 // Default to first plan
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/tenant/register', formData);
      
      if (response.data.success) {
        // Store credentials and redirect
        dispatch(setCredentials({
          user: response.data.data.user,
          token: response.data.data.token,
          tenant: response.data.data.tenant
        }));
        
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('tenantId', response.data.data.tenant.id);
        
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-10 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Company Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Company Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="subdomain" className="sr-only">Subdomain</label>
              <div className="relative">
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Your subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  .yourdomain.com
                </div>
              </div>
            
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantRegisterPage;
```

### 3.4 Create Billing Management Page

```jsx
// frontend/src/app/billing/page.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTenantInfo } from '../../features/tenant/tenantSlice';

const BillingPage = () => {
  const dispatch = useDispatch();
  const { info: tenant, loading } = useSelector(state => state.tenant);

  useEffect(() => {
    dispatch(fetchTenantInfo());
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

 const currentPlan = tenant?.Subscriptions?.[0]?.SubscriptionPlan;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Current Plan</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your current subscription details
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {currentPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{currentPlan.name}</h4>
                <p className="mt-1 text-sm text-gray-500">{currentPlan.description}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  ${currentPlan.price} <span className="text-sm font-normal text-gray-500">/ {currentPlan.billingCycle}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tenant.Subscriptions[0].status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.Subscriptions[0].status}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Next Billing</span>
                  <span className="text-sm text-gray-900">
                    {tenant.Subscriptions[0].nextBillingDate 
                      ? new Date(tenant.Subscriptions[0].nextBillingDate).toLocaleDateString() 
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Users</span>
                  <span className="text-sm text-gray-900">
                    {tenant.Subscriptions[0].SubscriptionPlan.maxUsers || 'Unlimited'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Sites</span>
                  <span className="text-sm text-gray-900">
                    {tenant.Subscriptions[0].SubscriptionPlan.maxSites || 'Unlimited'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No active subscription found.</p>
          )}
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upgrade Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan cards would go here */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-lg font-medium text-gray-900">Basic Plan</h4>
              <p className="mt-2 text-3xl font-semibold text-gray-90">$29<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2">
                <li className="text-sm text-gray-600">Up to 5 users</li>
                <li className="text-sm text-gray-600">Up to 2 sites</li>
                <li className="text-sm text-gray-600">Basic features</li>
              </ul>
              <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                Upgrade
              </button>
            </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-lg font-medium text-gray-900">Professional Plan</h4>
              <p className="mt-2 text-3xl font-semibold text-gray-900">$99<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2">
                <li className="text-sm text-gray-600">Up to 25 users</li>
                <li className="text-sm text-gray-600">Up to 10 sites</li>
                <li className="text-sm text-gray-600">Advanced features</li>
              </ul>
              <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                Upgrade
              </button>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-lg font-medium text-gray-900">Enterprise Plan</h4>
              <p className="mt-2 text-3xl font-semibold text-gray-900">$299<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2">
                <li className="text-sm text-gray-600">Unlimited users</li>
                <li className="text-sm text-gray-600">Unlimited sites</li>
                <li className="text-sm text-gray-600">All features</li>
              </ul>
              <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
```

## Phase 4: Payment Integration

### 4.1 Payment Service

```javascript
// backend/src/payment/payment.service.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Subscription, BillingHistory, Tenant, SubscriptionPlan } = require("../../models");
const { Op } = require("sequelize");

const createPaymentIntent = async (tenantId, amount, currency = 'usd') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        tenantId: tenantId.toString()
      }
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(`Payment intent creation failed: ${error.message}`);
  }
};

const processSubscriptionPayment = async (tenantId, subscriptionId) => {
  try {
    const subscription = await Subscription.findByPk(subscriptionId, {
      include: [{ model: SubscriptionPlan }]
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const plan = subscription.SubscriptionPlan;
    const amount = plan.price * 10; // Convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      metadata: {
        tenantId: tenantId.toString(),
        subscriptionId: subscriptionId.toString(),
        planId: plan.id.toString()
      }
    });

    // Create billing history record
    await BillingHistory.create({
      tenantId,
      subscriptionId,
      amount: plan.price,
      currency: 'USD',
      status: 'pending',
      invoiceNumber: `INV-${Date.now()}`,
      dueDate: new Date()
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(`Subscription payment processing failed: ${error.message}`);
  }
};

const handlePaymentSuccess = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { tenantId, subscriptionId } = paymentIntent.metadata;

    // Update billing history
    await BillingHistory.update({
      status: 'paid',
      paymentDate: new Date()
    }, {
      where: {
        subscriptionId,
        tenantId,
        status: 'pending'
      }
    });

    // Update subscription next billing date
    const subscription = await Subscription.findByPk(subscriptionId);
    if (subscription) {
      const nextBillingDate = new Date(subscription.nextBillingDate || subscription.startDate);
      if (subscription.SubscriptionPlan.billingCycle === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else if (subscription.SubscriptionPlan.billingCycle === 'annual') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }

      await subscription.update({
        status: 'active',
        nextBillingDate
      });
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Payment success handling failed: ${error.message}`);
  }
};

const handlePaymentFailure = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { tenantId, subscriptionId } = paymentIntent.metadata;

    // Update billing history
    await BillingHistory.update({
      status: 'failed'
    }, {
      where: {
        subscriptionId,
        tenantId,
        status: 'pending'
      }
    });

    // Check if this was a subscription renewal failure
    const subscription = await Subscription.findByPk(subscriptionId);
    if (subscription) {
      // If payment failed for renewal, mark subscription as expired after grace period
      // For now, we'll just log it - in real app you'd have grace period logic
      console.log(`Payment failed for subscription ${subscriptionId}, tenant ${tenantId}`);
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Payment failure handling failed: ${error.message}`);
  }
};

module.exports = {
  createPaymentIntent,
 processSubscriptionPayment,
 handlePaymentSuccess,
  handlePaymentFailure
};
```

## Phase 5: Migration Script

### 5.1 Data Migration Script

```javascript
// backend/scripts/migrate-to-multi-tenant.js
const { sequelize } = require('../configs/db.config');
const { Tenant, User, Subscription, SubscriptionPlan } = require('../models');

const migrateToMultiTenant = async () => {
  try {
    console.log('Starting multi-tenant migration...');

    // Create default tenant for existing data
    const defaultTenant = await Tenant.create({
      name: 'Default Company',
      subdomain: 'default',
      status: 'active'
    });

    console.log(`Created default tenant with ID: ${defaultTenant.id}`);

    // Update all existing records to belong to default tenant
    await sequelize.query(`
      UPDATE users SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE sites SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE machinery SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE items SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE item_groups SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE units SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE requisitions SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE procurement SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE invoices SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE vendors SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE maintenance_logs SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE scheduled_maintenance SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE machine_transfers SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE logbook_entries SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE material_issues SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE notifications SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE departments SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE roles SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE primary_categories SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE machine_categories SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE stock_logs SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE site_inventory SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE payments SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
      UPDATE machinery_item_codes SET tenant_id = ${defaultTenant.id} WHERE tenant_id IS NULL;
    `);

    // Create default subscription plan
    const defaultPlan = await SubscriptionPlan.create({
      name: 'Starter Plan',
      description: 'Basic plan for small businesses',
      price: 29.99,
      billingCycle: 'monthly',
      maxUsers: 5,
      maxSites: 2,
      maxMachines: 10,
      features: {
        basicFeatures: true,
        advancedReports: false,
        customBranding: false
      },
      isActive: true
    });

    console.log(`Created default subscription plan with ID: ${defaultPlan.id}`);

    // Create subscription for default tenant
    await Subscription.create({
      tenantId: defaultTenant.id,
      planId: defaultPlan.id,
      status: 'active',
      startDate: new Date(),
      nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });

    console.log('Multi-tenant migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

if (require.main === module) {
  migrateToMultiTenant()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateToMultiTenant;
```

## Phase 6: Deployment Configuration

### 6.1 Environment Variables

```bash
# .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/erp_saas
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
FRONTEND_URL=https://yourdomain.com
```

### 6.2 Update App.js with Tenant Middleware

```javascript
// backend/app.js (updated)
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const responseFormatter = require("./middlewares/responseFormatter");
const errorHandler = require("./middlewares/errorHandler");
const tokenValidator = require("./middlewares/tokenValidator");
const tenantMiddleware = require("./middlewares/tenantMiddleware");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const Cron = require("node-cron");

const transferRoutes = require("./src/machineTransfer/transfer.routes");
const logbookRoutes = require("./src/logbook/logbook.routes");
const materialRequisitionRoutes = require("./src/requisition/requisition.routes");
const notificationRoutes = require("./src/notification/notification.routes");

const startCronJobs = require("./src/cronJobs/index");
startCronJobs();

const app = express();
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 100 requests per windowMs
 standardHeaders: true, // Send rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again later.",
});

app.use(helmet());
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "https://erp.glimstarai.com",
      /\.yourdomain\.com$/  // Allow all subdomains
    ],
    credentials: true, // Allow cookies and headers to be sent
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"],
  })
);

//External APIs
Cron.schedule("*/10 * * *", () => {
  fetch("https://cpc-erp-server.onrender.com/test", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
});

app.get("/test", (req, res) => {
  res.send("Hello world!");
});

app.use(responseFormatter); // Response Formatter

// Public routes that don't require authentication or tenant context
app.use("/api/auth/", require("./src/auth/auth.routes"));
app.use("/api/tenant/", require("./src/tenant/tenant.routes")); // Tenant registration

// Protected routes that require authentication and tenant context
app.use(tokenValidator); // JWT validation
app.use(tenantMiddleware); // Tenant context validation

// All other routes require tenant context
app.use("/api/sites/", require("./src/site.routes"));
app.use("/api/users/", require("./src/user.routes"));
app.use("/api/machinery/", require("./src/machinery/machinery.routes"));
app.use("/api/category/", require("./src/category.routes"));
app.use(
  "/api/machinery-item-codes/",
  require("./src/machineryItemCode/machineryItemCode.routes")
);
app.use("/api/", [
  transferRoutes,
  logbookRoutes,
  materialRequisitionRoutes,
  notificationRoutes,
  require("./src/ItemGroup/itemGroup.routes"),
  require("./src/Item/item.routes"),
  require("./src/Unit/unit.routes"),
  require("./src/procurement/procurement.routes"),
  require("./src/vendor/vendor.routes"),
  require("./src/invoice/invoice.routes"),
  require("./src/dashboard/dashboard.routes"),
  require("./src/reports/reports.routes"),
  require("./src/billing/billing.routes"), // New billing routes
]);
app.use("/api/maintanance/", require("./src/maintanance/maintance.routes"));
app.use("/api/material-issues/", require("./src/materialIssue/issue.routes"));
app.use("/api/inventory/", require("./src/inventory/inventory.routes"));
app.use("/api/files/", require("./src/file/file.routes"));

app.use(errorHandler);

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server started at port ${process.env.PORT || 3000}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
```

## Phase 7: Testing Strategy

### 7.1 Unit Tests for Tenant Isolation

```javascript
// backend/tests/tenant-isolation.test.js
const request = require('supertest');
const app = require('../app');
const { Tenant, User, Site } = require('../models');

describe('Tenant Data Isolation', () => {
  let tenant1, tenant2;
  let user1, user2;
  let token1, token2;

  beforeAll(async () => {
    // Create test tenants
    tenant1 = await Tenant.create({
      name: 'Tenant 1',
      subdomain: 'tenant1',
      status: 'active'
    });

    tenant2 = await Tenant.create({
      name: 'Tenant 2',
      subdomain: 'tenant2',
      status: 'active'
    });

    // Create users for each tenant
    user1 = await User.create({
      tenantId: tenant1.id,
      name: 'User 1',
      email: 'user1@test.com',
      password: 'password',
      status: 'active'
    });

    user2 = await User.create({
      tenantId: tenant2.id,
      name: 'User 2',
      email: 'user2@test.com',
      password: 'password',
      status: 'active'
    });

    // Generate tokens (simplified for example)
    token1 = 'token_for_tenant1';
    token2 = 'token_for_tenant2';
  });

  test('Users from different tenants cannot access each other\'s data', async () => {
    // Create sites for each tenant
    await Site.create({
      tenantId: tenant1.id,
      name: 'Site 1',
      address: 'Address 1',
      status: 'active',
      departmentId: 1
    });

    await Site.create({
      tenantId: tenant2.id,
      name: 'Site 2',
      address: 'Address 2',
      status: 'active',
      departmentId: 1
    });

    // Request sites using tenant 1 token
    const response1 = await request(app)
      .get('/api/sites')
      .set('Authorization', `Bearer ${token1}`)
      .set('x-tenant-id', tenant1.id)
      .expect(200);

    expect(response1.body.data.rows.length).toBe(1);
    expect(response1.body.data.rows[0].name).toBe('Site 1');

    // Request sites using tenant 2 token
    const response2 = await request(app)
      .get('/api/sites')
      .set('Authorization', `Bearer ${token2}`)
      .set('x-tenant-id', tenant2.id)
      .expect(200);

    expect(response2.body.data.rows.length).toBe(1);
    expect(response2.body.data.rows[0].name).toBe('Site 2');
  });

  test('Cross-tenant access is prevented', async () => {
    // Try to access tenant 2's site using tenant 1's token
    const response = await request(app)
      .get('/api/sites')
      .set('Authorization', `Bearer ${token1}`)
      .set('x-tenant-id', tenant2.id) // Wrong tenant ID
      .expect(404); // Should not find data for wrong tenant
  });
});
```

## Implementation Timeline

### Week 1-2: Database Schema Changes
- Create tenant, subscription, and billing tables
- Add tenant_id to all existing tables
- Create indexes for performance
- Write and test migration script

### Week 3-4: Backend Implementation
- Create tenant models and services
- Implement tenant middleware
- Update all existing services to include tenant context
- Create tenant registration and subscription endpoints

### Week 5-6: Payment Integration
- Integrate payment gateway (Stripe/Razorpay)
- Create billing service
- Implement subscription management
- Add webhook handlers for payment events

### Week 7-8: Frontend Implementation
- Update Redux store for tenant context
- Create tenant registration page
- Create billing management page
- Update all API calls to include tenant context

### Week 9-10: Testing and Migration
- Write comprehensive tests for tenant isolation
- Run migration script on existing data
- Perform end-to-end testing
- Security testing for data isolation

### Week 11-12: Deployment and Monitoring
- Deploy to production
- Set up monitoring for multi-tenant performance
- Create tenant management dashboard for admin
- Document the new system architecture

This comprehensive plan will transform your current ERP application into a fully functional SaaS platform with proper multi-tenancy, data isolation, and subscription-based billing.
