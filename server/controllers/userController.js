import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

// Signup a new user
export const signup= async (req,res)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
    const {fullName,email,password,bio}=req.body
    try{
        if(!fullName || !email || !password || !bio){
            return res.json({success:false,message:"Missing Details"})
        }
        const user=await User.findOne({email})
        if(user){
            return res.json({success:false,message:"User already exist"})
        }
        const salt=await bcrypt.genSalt(10)
        const hashedPassword= await bcrypt.hash(password,salt)
        const newUser= await User.create({
            fullName,email,password:hashedPassword,bio
        })
        const token=generateToken(newUser._id)
        res.json({success:true,user:newUser,token,message:"Account created successfully"})
    }catch (error){
        res.json({success:false,message:error.message})
    }
}


//controller to login a user
export const login= async (req,res)=>{
    try {
        const {email,password}=req.body
        const userData=await User.findOne({email})

        const isPasswordCorrect=await bcrypt.compare(password, userData.password);

        if(!isPasswordCorrect){
            return res.json({success:false,message:"invalid credentials"})
        }
        const token=generateToken(userData._id)
        res.json({success:true,userData,token,message:"Login Successful"})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
    }
}

//controller to check if user is authenticated
export const checkAuth=(req,res)=>{
    res.json({success:true,user:req.user})
}

// controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    console.log("req.user:", req.user);   // ✅ check if middleware works
    console.log("req.body:", req.body);   // ✅ see what frontend sends

    const { profilePic, bio, fullName } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.json({ success: false, message: "User not authenticated" });
    }

    let updateFields = { bio, fullName };

    if (profilePic && profilePic.trim() !== "") {
      try {
        const upload = await cloudinary.uploader.upload(profilePic);
        updateFields.profilePic = upload.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr.message);
        return res.json({ success: false, message: "Image upload failed" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

