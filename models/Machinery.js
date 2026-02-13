module.exports = (sequelize, DataTypes) => {
  const Machinery = sequelize.define(
    "Machinery",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      primaryCategoryId: { type: DataTypes.INTEGER, allowNull: true }, // Foreign Key for PrimaryCategory
      machineCategoryId: { type: DataTypes.INTEGER, allowNull: true }, // Foreign Key for MachineCategory
      erpCode: { type: DataTypes.STRING, allowNull: true, unique: true }, // ERP Code
      registrationNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      }, // Registration Number
      machineNumber: { type: DataTypes.STRING, allowNull: true, unique: true }, // Machine Number
      machineCode: { type: DataTypes.STRING, allowNull: true, unique: true }, // Machine Code
      chassisNumber: { type: DataTypes.STRING, allowNull: true, unique: true }, // Chassis Number
      engineNumber: { type: DataTypes.STRING, allowNull: true, unique: true }, // Engine Number
      serialNumber: { type: DataTypes.STRING, allowNull: true, unique: true }, // Serial Number
      model: { type: DataTypes.STRING, allowNull: true }, // Model
      make: { type: DataTypes.STRING, allowNull: true }, // Make
      yom: { type: DataTypes.INTEGER, allowNull: true }, // Year of Manufacture (YOM)
      purchaseDate: { type: DataTypes.DATE, allowNull: true }, // Purchase Date
      capacity: { type: DataTypes.STRING, allowNull: true }, // Capacity
      ownerName: { type: DataTypes.STRING, allowNull: true }, // Owner Name
      ownerType: { type: DataTypes.STRING, allowNull: true }, // Owner Type (Company/Individual)
      siteId: { type: DataTypes.INTEGER, allowNull: true }, // Foreign Key - Site
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true }, // Is Active
      machineName: { type: DataTypes.STRING, allowNull: true }, // Machine name
      fitnessCertificateExpiry: { type: DataTypes.DATE, allowNull: true }, // Fitness certificate expiry date
      motorVehicleTaxDue: { type: DataTypes.DATE, allowNull: true }, // Motor vehicle tax due date
      permitExpiryDate: { type: DataTypes.DATE, allowNull: true }, // Permit expiry date
      nationalPermitExpiry: { type: DataTypes.DATE, allowNull: true }, // National permit expiry date
      insuranceExpiry: { type: DataTypes.DATE, allowNull: true }, // Insurance expiry date
      pollutionCertificateExpiry: { type: DataTypes.DATE, allowNull: true }, // Pollution certificate expiry date
      fitnessCertificateFile: { type: DataTypes.STRING, allowNull: true }, // Fitness certificate file
      pollutionCertificateFile: { type: DataTypes.STRING, allowNull: true }, // Pollution certificate file
      insuranceFile: { type: DataTypes.STRING, allowNull: true }, // Insurance file
      permitFile: { type: DataTypes.STRING, allowNull: true }, // Permit file
      nationalPermitFile: { type: DataTypes.STRING, allowNull: true }, // National permit file
      motorVehicleTaxFile: { type: DataTypes.STRING, allowNull: true }, // Motor vehicle tax file
      machineImageFile: { type: DataTypes.STRING, allowNull: true }, // Machine image file
      status: {
        type: DataTypes.ENUM("Idle", "In Use", "In Transfer", "Sold", "Scrap"),
        allowNull: true,
        defaultValue: "Idle",
      }, // Machine status
      totalHoursRun: { type: DataTypes.FLOAT, allowNull: true }, // Total hours run
      totalKmRun: { type: DataTypes.FLOAT, allowNull: true }, // Total kilometers run
      lastServiceDate: { type: DataTypes.DATE, allowNull: true }, // Last service date
      lastServiceAtkm: { type: DataTypes.FLOAT, allowNull: true }, // Last service at kilometers
      lastServiceAtHours: { type: DataTypes.FLOAT, allowNull: true }, // Last service at hours
    },
    {
      tableName: "machineries", // Table name in your database
      timestamps: true,
      paranoid: true,
      hooks: {
        afterCreate: async (machine, options) => {
          const newErpCode = `ERP-${String(machine.id).padStart(4, "0")}`;
          await machine.update(
            { erpCode: newErpCode },
            { transaction: options.transaction }
          );
        },
      },
    }
  );

  Machinery.associate = (models) => {
    // Establishing connection with PrimaryCategory
    Machinery.belongsTo(models.PrimaryCategory, {
      foreignKey: "primaryCategoryId",
      as: "primaryCategory",
    });

    // Establishing connection with MachineCategory
    Machinery.belongsTo(models.MachineCategory, {
      foreignKey: "machineCategoryId",
      as: "machineCategory",
    });
    // Existing association with Site
    Machinery.belongsTo(models.Site, {
      foreignKey: "siteId",
      as: "site",
    });
    Machinery.hasMany(models.LogbookEntry, {
      foreignKey: "machineId",
      as: "logbookEntries",
    });
  };

  return Machinery;
};
