import express from "express";
import {getComapny, getCompanyById, registerCompany, updateCompany} from "../controllers/company.controller.js"
import isAuthenticated from "../middlewares/isAuthenticated.js"
import {singleUpload} from "../middlewares/multer.js"

const router=express.Router();

router.route("/register").post(isAuthenticated,registerCompany);
router.route("/get").get(isAuthenticated,getComapny);
router.route("/get/:id").get(isAuthenticated,getCompanyById);
router.route("/update/:id").put(isAuthenticated,singleUpload,updateCompany)

export default router;