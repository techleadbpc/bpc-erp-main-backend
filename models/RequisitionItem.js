// models/RequisitionItem.js
module.exports = (sequelize, DataTypes) => {
    const RequisitionItem = sequelize.define('RequisitionItem', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      requisitionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      tableName: 'requisition_items',
    });
  
    RequisitionItem.associate = (models) => {
      RequisitionItem.belongsTo(models.Requisition, {
        foreignKey: 'requisitionId',
      });
      RequisitionItem.belongsTo(models.Item, {
        foreignKey: 'itemId',
      });
    };
  
    return RequisitionItem;
  };
  