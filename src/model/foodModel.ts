import { DataTypes, Model } from "sequelize";
import { db } from "../config";
import { VendorInstance } from "./vendorModel";

export interface FoodAttributes {
  id: string;
  name: string;
  description: string;
  category: string;
  foodType: string;
  readyTime: number;
  price: number;
  rating: number;
  vendorId: string;
  image: string;
}

export class FoodInstance extends Model<FoodAttributes> {}

FoodInstance.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    foodType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    readyTime: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    price: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    rating: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    vendorId: {
      type: DataTypes.UUIDV4,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },

  {
    sequelize: db,
    tableName: "food",
  }
);
