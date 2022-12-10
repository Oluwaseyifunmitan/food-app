import express, { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { FoodAttributes, FoodInstance } from "../model/foodModel";
import { VendorAttributes, VendorInstance } from "../model/vendorModel";
import {
  option,
  GenerateSignature,
  validatePassword,
  loginSchema,
  updateVendorSchema,
} from "../utils";
import { v4 as uuidv4 } from "uuid";

export const vendorLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const validateResult = loginSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    const Vendor = (await VendorInstance.findOne({
      where: { email: email },
    })) as unknown as VendorAttributes;

    if (Vendor) {
      const validation = await validatePassword(
        password,
        Vendor.password,
        Vendor.salt
      );
      if (validation) {
        //Genrate signature for vendor
        let signature = await GenerateSignature({
          id: Vendor.id,
          email: Vendor.email,
          serviceAvailable: Vendor.serviceAvailable,
        });
        return res.status(200).json({
          message: "You have successfully logged in",
          signature,
          email: Vendor.email,
          serviceAvailable: Vendor.serviceAvailable,
          role: Vendor.role,
        });
      }
    }
    return res
      .status(400)
      .json({ Error: "Wrong username or password or not a verified vendor" });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server error",
      route: "/vendors/login",
    });
  }
};

/**=================================Vendor Add Food========= */

export const createFood = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;
    const { name, description, category, foodType, readyTime, price, image } =
      req.body;
    const foodid = uuidv4();

    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
    })) as unknown as VendorAttributes;

    if (Vendor) {
      const createFood = await FoodInstance.create({
        id: foodid,
        name,
        description,
        category,
        foodType,
        readyTime,
        price,
        rating: 0,
        vendorId: id,
        image: req.file.path,
      });
      return res.status(201).json({
        message: "food added successfully",
        createFood,
      });
    }
  } catch (err) {
    res.status(500).json({
      Error: "Internal server error",
      route: "/vendors/create-food",
    });
  }
};

/**=================================Get Vendors Porfile======*/
export const VendorProfile = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;

    //check if vendor exists
    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
      include: [
        {
          model: FoodInstance,
          as: "food",
          attributes: [
            "id",
            "name",
            "description",
            "category",
            "foodType",
            "readyTime",
            "price",
            "rating",
            "vendorId",
          ],
        },
      ],
    })) as unknown as VendorAttributes;
    return res.status(200).json({ Vendor });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server error",
      route: "/vendors/get-profile",
    });
  }
};

/**=================================VENDOR DELETE FOOD======*/
export const deleteFood = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;
    const foodid = req.params.foodid;

    //check if vendor exists
    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
    })) as unknown as VendorAttributes;

    if (Vendor) {
      const deletedFood = await FoodInstance.destroy({ where: { id: foodid } });
      return res
        .status(200)
        .json({ message: "you have successfully deleted food", deletedFood });
    }
  } catch (err) {
    res.status(500).json({
      Error: "Internal server error",
      route: "/vendors/delete-food",
    });
  }
};
//****=====================updateVendor Profile====================== */
export const updatedVendorProfile = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;
    const { name, phone, address, coverImage } = req.body;
    //Joi validation
    const validateResult = updateVendorSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    //check if the user is a registered user
    const User = (await VendorInstance.findOne({
      where: { id: id },
    })) as unknown as VendorAttributes;

    if (!User) {
      return res
        .status(400)
        .json({ message: "You are not authorized to update your profile" });
    }

    const updatedUser = (await VendorInstance.update(
      {
        name,
        phone,
        address,
        coverImage: req.file.path,
      },
      { where: { id: id } }
    )) as unknown as VendorAttributes;

    if (updatedUser) {
      const Vendor = (await VendorInstance.findOne({
        where: { id: id },
      })) as unknown as VendorAttributes;

      return res.status(200).json({
        message: "you have successfully updated your profile",
        Vendor,
      });
    }
    return res.status(400).json({ message: "Error occured" });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/vendors/update-profile",
    });
  }
};
//****=====================GETALLVENDORSe====================== */
export const GetAllVendors = async (req: Request, res: Response) => {
  try {
    const Vendor = await VendorInstance.findAndCountAll({});
    return res.status(200).json({ vendor: Vendor.rows });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/vendors/get-all-vendors",
    });
  }
};

/**=================================Get food by vendor======*/
export const GetFoodByVendor = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    //check if vendor exists
    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
      include: [
        {
          model: FoodInstance,
          as: "food",
          attributes: [
            "id",
            "name",
            "description",
            "category",
            "foodType",
            "readyTime",
            "price",
            "image",
            "rating",
            "vendorId",
          ],
        },
      ],
    })) as unknown as VendorAttributes;
    return res.status(200).json({ Vendor });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server error",
      route: "/vendors/get-profile",
    });
  }
};
