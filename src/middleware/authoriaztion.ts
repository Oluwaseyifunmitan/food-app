import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { APP_SECRET } from "../config";
import { UserAttributes, UserInstance } from "../model/userModel";
import { VendorInstance } from "../model/vendorModel";

export const auth = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({ Error: "Kindly signin" });
    }
    const token = authorization.slice(7, authorization.length);
    let verified = jwt.verify(token, APP_SECRET);

    if (!verified) {
      return res.status(401).json({ Error: "unauthorized" });
    }
    const { id } = verified as { [key: string]: string };

    //find user by id
    const user = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;

    if (!user) {
      return res.status(401).json({ Error: "Invalid credentials" });
    }
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ Error: "unauthorized" });
  }
};

export const authVendor = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({ Error: "Kindly signin" });
    }
    const token = authorization.slice(7, authorization.length);
    let verified = jwt.verify(token, APP_SECRET);

    if (!verified) {
      return res.status(401).json({ Error: "unauthorized" });
    }
    const { id } = verified as { [key: string]: string };

    //find vendor by id
    const vendor = (await VendorInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;

    if (!vendor) {
      return res.status(401).json({ Error: "Invalid credentials" });
    }
    req.vendor = verified;
    next();
  } catch (err) {
    return res.status(401).json({ Error: "unauthorized" });
  }
};
