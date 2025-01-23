import {User} from "../models/user.model.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import axios from "axios";
import useragent from "useragent"

import {S3Client,GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3'
import  { getSignedUrl } from '@aws-sdk/s3-request-presigner';

 const s3Client= new S3Client({
    region:"eu-north-1",
    credentials:{
        accessKeyId:"AKIAZI2LGMLHRAZSMITA",
        secretAccessKey:"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"
    }
 })


 import nodemailer from 'nodemailer'
 const transpoter= nodemailer.createTransport({
     secure:true,
     host:"smtp.gmail.com",
     port:465,
     auth:{
         user:'singlaanmol23@gmail.com',
         pass:'nukyzusflzfvzlyf'
     }
 })
 
 function sendMail(to,sub,msg){
     transpoter.sendMail({
         to:to,
         subject:sub,
         html:msg
     });
      
 }
 
 // sendMail("singlaanmol23@gmail.com","Haan bhai","Kiase ho");
 




 const getLocationFromIP = async (ip) => {
    try {
    const response = await axios.get(`https://ipinfo.io?token=e8703b54959057`);
      return response.data; // Includes city, region, country, etc.
    } catch (error) {
      console.error("Error fetching location:", error.message);
      return { city: "Unknown", region: "Unknown", country: "Unknown" };
    }
  };
  


//REGISTER
export const register= async(req,res)=>{
    try {
        const {fullname,email,phoneNumber,password,role}=req.body;
        if(!fullname || !email || !phoneNumber || !password || !role){
            return res.status(400).json({
                message:"something is missing",
                success:false
            });
        };

        const file= req.file;
        const fileUri= getDataUri(file);
        const cloudResponse=await cloudinary.uploader.upload(fileUri.content);


        //checkl kaar email pehle se to nahi exsist karti 
        const user=await User.findOne({email});
        if(user){
            return res.status(400).json({
                message:"email already exsist",
                success:false
            })
        }

        //pass hash kaar
        const hashedPassword= await bcrypt.hash(password,10);
        await User.create({
            fullname,
            email,
            phoneNumber,
            password:hashedPassword,
            role,
            profile:{
                profilePhoto:cloudResponse.secure_url
            }
        });
        sendMail(`${email}`,`Hi ${fullname} You have successfully registered your account on ElevateU`,`We Welcome you`);
        return res.status(201).json({
            message:"Account created",
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}

//LOGIN
export const login=async (req,res)=>{
    try {
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({
                message:"something is missing",
                success:false
            });
        };
        let user= await User.findOne({email});
        if(!user){
            return res.status(400).json({
                message:"email or password is incorrect",
                success:false
            })
        }
        const isPasswordMatch= await bcrypt.compare(password,user.password);
        if(!isPasswordMatch){
            return res.status(400).json({
                message:"Incorrect email or password",
                success:false
            })
        };

        // if(role != user.role){
        //     return res.status(400).json({
        //         message:"Account doesnt exsist ",
        //         success:false
        //     })
        // }
        const tokenData={
            userId:user._id
        }
        const token=await jwt.sign(tokenData,process.env.SECRET_KEY,{expiresIn:'1d'});
        user={
            _id:user._id,
            fullname:user.fullname,
            email:user.email,
            phoneNumber:user.phoneNumber,
            role:user.role,
            profile:user.profile,

        }
        
        const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const deviceInfo = useragent.parse(req.headers["user-agent"]).toString();
    const location = await getLocationFromIP(ipAddress);

    // const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });

    const emailBody = `
      <h1>Login Alert</h1>
      <p>You logged into your account.</p>
      <ul>
        <li><b>Device:</b> ${deviceInfo}</li>
        <li><b>IP Address:</b> ${ipAddress}</li>
        <li><b>Location:</b> ${location.city}, ${location.region}, ${location.country}</li>
      </ul>
    `;
    sendMail(user.email, "Login Alert", emailBody);


        return res.status(200).cookie("token",token,{maxAge:1*24*60*60*1000,httpsOnly:true,sameSite:'Strict'}).json({
            message:`Welcome back ${user.fullname}`,
            user,
            success:true
        })
    } catch (error) {
        console.log(error);
        
    }
}


export const logout=async (req,res)=>{
    try {
        return res.status(200).cookie("token","",{maxAge:0}).json({
            message:"Log out success",
            seccess:true
        })
    } catch (error) {
        console.log(error); 
    }
}

async function putObject(filename,contentType){
    const command= new PutObjectCommand({
       Bucket:"new-private-01",
       Key:`resume/${filename}`,
       ContentType:contentType
    })
    const url= await getSignedUrl(s3Client,command);
    return url;
  }

  async function getObjectURL(key){
    const command= new GetObjectCommand({
        Bucket:"new-private-01",
        Key:key,
    })
    const url= getSignedUrl(s3Client,command,{ expiresIn: 604800 });
    return url
 }



export const updateProfile=async (req,res)=>{
    try {
        const {fullname,email,phoneNumber,bio,skills}=req.body;
        const file=req.file;


        
        // const cloudResponse = await cloudinary.uploader.upload(fileUri.content);



        // if(!fullname || !email || !phoneNumber || !bio || !skills){
        //     return res.status(400).json({
        //         message:"something is missing",
        //         success:false
        //     });
        // };


        //cloudinary ayega edhar
        let skillsArray;
        if(skills){
            skillsArray=skills.split(",");
            
        }
        const userId=req.id; //middle ware authen
        let user = await User.findById(userId);

        if(!user){
            return res.status(400).json({
                message:"User not found",
                success:false
            })
        }
        
        if(fullname) user.fullname=fullname;
        if(email) user.email=email;
        if(phoneNumber) user.phoneNumber=phoneNumber;
        if(bio) user.profile.bio=bio;
        if(skills) user.profile.skills=skillsArray;
        // console.log(geturi);
        if(file){
            const fileUri=getDataUri(file);
        console.log(fileUri.fileName);
        const uri= await putObject(email.split('.')[0]+ '.pdf',"application/pdf")
        // console.log(uri);

        const uploadResponse = await axios.put(uri, file.buffer, {
            headers: {
                "Content-Type": file.mimetype,
            },
        });
            // const geturi=
            user.profile.resume=await getObjectURL(`resume/${email.split('.')[0]}.pdf`);
            user.profile.resumeOrignalName=user.fullname;
        } 
        // if(fullname) user.fullname=fullname;

        // user.fullname=fullname,
        // user.email=email,
        // user.phoneNumber=phoneNumber,
        // user.profile.bio=bio,
        // user.profile.skills=skillsArray
        
        // if(cloudResponse){
        //     user.profile.resume=cloudResponse.secure_url
        //     user.profile.resumeOrignalName=file.orignalname
        // }


        await user.save()


        user={
            _id:user._id,
            fullname:user.fullname,
            email:user.email,
            phoneNumber:user.phoneNumber,
            role:user.role,
            profile:user.profile,

        }

        return res.status(200).json({
            message:"profile upadted",
            user,
            seccess:true
        })
 
    } catch (error) {
        console.log(error);
    }
}