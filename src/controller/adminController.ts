import express, { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { UserAttributes, UserInstance } from "../model/userModel";
import { v4 as uuidv4 } from "uuid";
import {
  adminSchema,
  GenerateOTP,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  option,
  vendorSchema,
} from "../utils";
import { VendorAttributes, VendorInstance } from "../model/vendorModel";

//** =========================register admin===============**/
export const AdminRegister = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;
    const { email, phone, password, firstName, lastName, address } = req.body;
    const uuiduser = uuidv4();

    const validateResult = adminSchema.validate(req.body, option);
    if (validateResult.error) {
      return res
        .status(400)
        .json({ Error: validateResult.error.details[0].message });
    }

    //Generate salt
    const salt = await GenerateSalt();
    const adminPassword = await GeneratePassword(password, salt);

    //Generate OTP
    const { otp, expiry } = GenerateOTP();

    //check if the Admin exist
    const Admin = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;

    if (Admin.email == email) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (Admin.phone == phone) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    //create Admin
    if (Admin.role === "superadmin") {
      let user = await UserInstance.create({
        id: uuiduser,
        email,
        password: adminPassword,
        firstName,
        lastName,
        salt,
        address,
        phone,
        otp,
        otp_expiry: expiry,
        lng: 0,
        lat: 0,
        verified: true,
        role: "admin",
      });

      //check if the admin exist

      const Admin = (await UserInstance.findOne({
        where: { id: id },
      })) as unknown as UserAttributes;

      //Generate a signature
      const signature = await GenerateSignature({
        id: Admin.id,
        email: email,
        verified: Admin.verified,
      });

      return res.status(201).json({
        message: "Admin created successfully",
        signature,
        verified: Admin.verified,
      });
    }
    return res.status(400).json({ message: "Admin already exists" });
  } catch (err) {
    res
      .status(500)
      .json({ Error: "Internal server Error", route: "/admins/create-admin" });
  }
};

export const superAdmin = async (req: JwtPayload, res: Response) => {
  try {
    const { email, phone, password, firstName, lastName, address } = req.body;
    const uuiduser = uuidv4();

    const validateResult = adminSchema.validate(req.body, option);
    if (validateResult.error) {
      return res
        .status(400)
        .json({ Error: validateResult.error.details[0].message });
    }

    //Generate salt
    const salt = await GenerateSalt();
    const adminPassword = await GeneratePassword(password, salt);

    //Generate OTP
    const { otp, expiry } = GenerateOTP();

    //check if the Admin exist
    const Admin = (await UserInstance.findOne({
      where: { email: email },
    })) as unknown as UserAttributes;

    //create Admin
    if (!Admin) {
      let user = await UserInstance.create({
        id: uuiduser,
        email,
        password: adminPassword,
        firstName,
        lastName,
        salt,
        address,
        phone,
        otp,
        otp_expiry: expiry,
        lng: 0,
        lat: 0,
        verified: true,
        role: "superadmin",
      });

      //check if the admin exist

      const Admin = (await UserInstance.findOne({
        where: { email: email },
      })) as unknown as UserAttributes;

      //Generate a signature
      const signature = await GenerateSignature({
        id: Admin.id,
        email: email,
        verified: Admin.verified,
      });

      return res.status(201).json({
        message: "Admin created successfully",
        signature,
        verified: Admin.verified,
      });
    }
    return res.status(400).json({ message: "Admin already exists" });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/admins/create-super-admin",
    });
  }
};

//** =========================Create Vendor===============**/
export const createVendor = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;
    const { name, restaurantName, pincode, phone, address, email, password } =
      req.body;
    const uuidvendor = uuidv4();
    const validateResult = vendorSchema.validate(req.body, option);
    if (validateResult.error) {
      return res
        .status(400)
        .json({ Error: validateResult.error.details[0].message });
    }
    //Generate salt
    const salt = await GenerateSalt();
    const vendorPassword = await GeneratePassword(password, salt);

    //check if the vendor exist
    const Vendor = (await VendorInstance.findOne({
      where: { email: email },
    })) as unknown as VendorAttributes;

    const Admin = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;

    if (Admin.role == "admin" || Admin.role == "superadmin") {
      if (!Vendor) {
        const createVendor = await VendorInstance.create({
          id: uuidvendor,
          name,
          restaurantName,
          pincode,
          phone,
          address,
          email,
          password: vendorPassword,
          salt,
          serviceAvailable: false,
          rating: 0,
          role: "vendor",
          coverImage: "",
        });
        return res.status(201).json({
          message: "vendor created successfully",
          createVendor,
        });
      }
      return res.status(400).json({ message: "Vendor already exists" });
    }
    return res.status(400).json({ message: "unauthorized" });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/admins/create-vendors",
    });
  }
};
