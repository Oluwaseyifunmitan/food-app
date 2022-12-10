import express, { Request, Response } from "express";
import {
  registerSchema,
  option,
  GenerateSalt,
  GeneratePassword,
  GenerateOTP,
  onRequestOTP,
  emailHtml,
  mailSent,
  GenerateSignature,
  verifySignature,
  loginSchema,
  validatePassword,
  updateSchema,
} from "../utils";
import { UserAttributes, UserInstance } from "../model/userModel";
import { v4 as uuidv4 } from "uuid";
import { FromAdminMail, userSubject } from "../config";
import { JwtPayload } from "jsonwebtoken";

export const Register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, confirm_password } = req.body;
    const uuiduser = uuidv4();
    const validateResult = registerSchema.validate(req.body, option);
    if (validateResult.error) {
      return res
        .status(400)
        .json({ Error: validateResult.error.details[0].message });
    }

    //Generate salt
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    //Generate OTP
    const { otp, expiry } = GenerateOTP();

    //check if the user exist
    const User = await UserInstance.findOne({ where: { email: email } });

    //create User
    if (!User) {
      let user = await UserInstance.create({
        id: uuiduser,
        email,
        password: userPassword,
        firstName: "",
        lastName: "",
        salt,
        address: "",
        phone,
        otp,
        otp_expiry: expiry,
        lng: 0,
        lat: 0,
        verified: false,
        role: "user",
      });

      //send otp to user
      await onRequestOTP(otp, phone);

      //send Email
      const html = emailHtml(otp);
      await mailSent(FromAdminMail, email, userSubject, html);

      //check if the user exist

      const User = (await UserInstance.findOne({
        where: { email: email },
      })) as unknown as UserAttributes;

      //Generate a signature
      const signature = await GenerateSignature({
        id: User.id,
        email: email,
        verified: User.verified,
      });

      return res.status(201).json({
        message:
          "User created successfully, check your email or phone number for otp verification",
        signature,
        verified: User.verified,
      });
    }
    return res.status(400).json({ message: "User already exists" });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ Error: "Internal server Error", route: "/users/signup" });
  }
};

//**====================verify users=================*/
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const token = req.params.signature;
    const decode = await verifySignature(token);

    // check if the user is a registered user
    const User = (await UserInstance.findOne({
      where: { email: decode.email },
    })) as unknown as UserAttributes;

    if (User) {
      const { otp } = req.body;
      if (User.otp === parseInt(otp) && User.otp_expiry >= new Date()) {
        const updatedUser = (await UserInstance.update(
          {
            verified: true,
          },
          { where: { email: decode.email } }
        )) as unknown as UserAttributes;

        // Generate a new signature
        let signature = await GenerateSignature({
          id: updatedUser.id,
          email: updatedUser.email,
          verified: updatedUser.verified,
        });
        if (updatedUser) {
          const User = (await UserInstance.findOne({
            where: { email: decode.email },
          })) as unknown as UserAttributes;

          return res.status(201).json({
            message: "You have successfully verified your account",
            signature,
            verified: User.verified,
          });
        }
      }
    }

    return res
      .status(400)
      .json({ Error: "Invalid credential or  otp already expired" });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server error",
      route: "/users/verify",
    });
  }
};

//** =========================login users===============**/
export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const validateResult = loginSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    const User = (await UserInstance.findOne({
      where: { email: email },
    })) as unknown as UserAttributes;
    if (User.verified == true) {
      const validation = await validatePassword(
        password,
        User.password,
        User.salt
      );
      if (validation) {
        //Genrate signature for user
        let signature = await GenerateSignature({
          id: User.id,
          email: User.email,
          verified: User.verified,
        });
        return res.status(200).json({
          message: "You have successfully logged in",
          signature,
          email: User.email,
          verified: User.verified,
          role: User.role,
        });
      }
      return res
        .status(400)
        .json({ Error: "Wrong username or password or not a verified user" });
    }
    return res
      .status(400)
      .json({ Error: "Wrong username or password or not a verified user" });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server error",
      route: "/users/login",
    });
  }
};

//**====================Resend OTP================**/
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const token = req.params.signature;
    const decode = await verifySignature(token);
    const User = (await UserInstance.findOne({
      where: { email: decode.email },
    })) as unknown as UserAttributes;

    if (User) {
      const { otp, expiry } = GenerateOTP();
      const updatedUser = (await UserInstance.update(
        {
          otp,
          otp_expiry: expiry,
        },
        { where: { email: decode.email } }
      )) as unknown as UserAttributes;

      if (updatedUser) {
        const User = (await UserInstance.findOne({
          where: { email: decode.email },
        })) as unknown as UserAttributes;

        // await onRequestOTP(otp, updatedUser.phone);

        const html = emailHtml(otp);
        await mailSent(FromAdminMail, updatedUser.email, userSubject, html);

        return res.status(200).json({
          message: "OTP resent to registered phone number and email",
        });
      }
    }
    return res.status(400).json({
      Error: "Error sending OTP",
    });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/resend-otp/:signature",
    });
  }
};

//**====================PROFILE================**/
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit as number | undefined;
    const users = await UserInstance.findAndCountAll({
      limit: limit,
    });
    return res.status(200).json({
      message: "You have successfully retrived all users",
      Count: users.count,
      Users: users.rows,
    });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/get-all-users",
    });
  }
};

export const getSingleUser = async (req: JwtPayload, res: Response) => {
  try {
    const { id } = req.user;

    //find user by id
    const User = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;
    if (User) {
      return res.status(200).json({ User });
    }
    return res.status(400).json({ message: "User not found" });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/get-user",
    });
  }
};
//****=====================updateUsers====================== */
export const updatedUserProfile = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;
    const { firstName, lastName, address, phone } = req.body;
    //Joi validation
    const validateResult = updateSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    //check if the user is a registered user
    const User = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;

    if (!User) {
      return res
        .status(400)
        .json({ message: "You are not authorized to update your profile" });
    }

    const updatedUser = (await UserInstance.update(
      {
        firstName,
        lastName,
        address,
        phone,
      },
      { where: { id: id } }
    )) as unknown as UserAttributes;

    if (updatedUser) {
      const User = (await UserInstance.findOne({
        where: { id: id },
      })) as unknown as UserAttributes;

      return res
        .status(200)
        .json({ message: "you have successfully updated your profile", User });
    }
    return res.status(400).json({ message: "Error occured" });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/update-profile",
    });
  }
};
