import express from "express";
import { auth } from "../middleware/authoriaztion";
import {
  AdminRegister,
  createVendor,
  superAdmin,
} from "../controller/adminController";

const router = express.Router();

router.post("/create-admin", auth, AdminRegister);
router.post("/create-super-admin", superAdmin);
router.post("/create-vendors", auth, createVendor);

export default router;
