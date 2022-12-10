import express, { Request, Response } from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";
import userRouter from "./routes/users";
import indexRouter from "./routes/index";
import adminRouter from "./routes/Admin";
import vendorRouter from "./routes/vendor";
import { db } from "./config";
import cors from "cors";

//sequelize connection
db.sync()
  .then(() => {
    console.log("Db connected succcessfully");
  })
  .catch((err) => {
    console.log(err);
  });

const app = express();

app.use(express.json());
app.use(logger("dev"));
app.use(cookieParser());
app.use(cors());

//Router middleware
app.use("/", indexRouter);
app.use("/users", userRouter);
app.use("/admins", adminRouter);
app.use("/vendors", vendorRouter);

const port = 4000;

app.listen(port, () => {
  console.log(`Server running on http:// localhost:${port}`);
});

export default app;
