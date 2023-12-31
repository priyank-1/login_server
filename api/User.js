const express = require("express");
const app = express();
const router = express.Router();
const jwt = require('jsonwebtoken');
// const secretKey = "keyvalue";


let refreshTokens = [];
const User = require("./../models/User");

const UserVerification = require("./../models/UserVerification");

const PasswordReset = require("./../models/PasswordReset");

const nodemailer = require("nodemailer");

const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const bcrypt = require("bcrypt");

//path for static verified page
const path = require("path");
const { log, error } = require("console");
const { constants } = require("buffer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready For Message");
    console.log(success);
  }
});




router.post("/signup", (req, res) => {
  let { name, email, password, dateOfBirth ,blogs} = req.body;
  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();
  blogs = [];

  if (name == "" || email == "" || password == "" || dateOfBirth == "") {
    res.json({
      status: "FAILED",
      message: "Empty input fields!",
    });
  } else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Invalid name entered",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Invalid email entered",
    });
  } else if (!new Date(dateOfBirth).getTime()) {
    res.json({
      status: "FAILED",
      message: "Invalid date of birth entered",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "Password is too short",
    });
  } else {
    //if user already exists
    User.find({ email })
      .then((result) => {
        if (result.length) {
          res.json({
            status: "FAILED",
            message: "User with the provided email alrready exists",
          });
        } else {
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newUser = new User({
                name,
                email,
                password: hashedPassword,
                dateOfBirth,
                verified: false,
              });

              newUser
                .save()
                .then((result) => {
                  // handle account verification
                  sendVerificationEmail(result, res);
                })
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    message: "An error occurred while saving user account!",
                  });
                });
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: "An error occurred while hashing password!",
              });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json({
          status: "FAILED",
          message: "AN error occurred while checking for exisitng user!",
        });
      });
  }
});

//send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
  const currentUrl = "http://localhost:3000/";

  const uniqueString = uuidv4() + _id;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link <b>expires in 6 Hours</b>.</p>
            <p>Press <a href=${
              currentUrl + "user/verify/" + _id + "/" + uniqueString
            }>here</a> to procedd.</p>`,
  };

  //hash the uniqueString
  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
      // set values in userVerification collection
      const newVerification = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        creadtedAt: Date.now(),
        expiresAt: Date.now() + 21600000,
      });

      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              res.json({
                status: "PENDING",
                message: "Verification Email Sent !",
              });
            })
            .catch((err) => {
              console.log(err);
              res.json({
                status: "FAILED",
                message: "Verification Email Failed",
              });
            });
        })
        .catch((err) => {
          console.log(err);
          res.json({
            status: "FAILED",
            message: "Could not save email Verification data!",
          });
        });
    })
    .catch(() => {
      res.json({
        status: "FAILED",
        message: "An error occurred while hashing email data!",
      });
    });
};

//verify
router.get("/verify/:userId/:uniqueString", (req, res) => {
  let { userId, uniqueString } = req.params;

  UserVerification.find({ userId })
    .then((result) => {
      if (result.length > 0) {
        //user verification record exists so we proceed
        const { expiresAt } = result[0];
        const hashedUniqueString = result[0].uniqueString;
        //checking for expired unique string
        if (expiresAt < Date.now()) {
          //record has expired so we delete it
          UserVerification.deleteOne({ userId })
            .then((result) => {
              User.deleteOne({ _id: userId })
                .then(() => {
                  let message = "Link has expired.Please sign up again!";
                  res.redirect(`/user/verified/?rr=true&message=${message}`);
                })
                .catch((err) => {
                  let message =
                    "Clearing user with expired unique string failed";
                  res.redirect(`/user/verified/?err=true&message=${message}`);
                });
            })
            .catch((err) => {
              console.log(err);
              let message =
                "An error occurred while clearing expired user verification record";
              res.redirect(`/user/verified/?err=true&message=${message}`);
            });
        } else {
          // valid record exists so we validate the user string
          //first compare the hashed unique string
          bcrypt
            .compare(uniqueString, hashedUniqueString)
            .then((result) => {
              if (result) {
                //strings match
                User.updateOne({ _id: userId }, { verified: true })
                  .then(() => {
                    UserVerification.deleteOne({ userId })
                      .then(() => {
                        try{res.sendFile(
                          path.join(__dirname, "./../views/verified.html")
                        );
                      }catch(err){
                        console.log(err);
                      }
                       
                      })
                      .catch((err) => {
                        console.log(err);
                        let message =
                          "An error occurred while finalizing successful verification.";
                        res.redirect(
                          `/user/verified/?err=true&message=${message}`
                        );
                      });
                  })
                  .catch((err) => {
                    console.log(err);
                    let message =
                      "An error occurred while updating user record to show verified.";
                    res.redirect(`/user/verified/?err=true&message=${message}`);
                  });
              } else {
                //existing record but incorrect verification details passed
                let message =
                  "Invalid verification details passed.Check your inbox.";
                res.redirect(`/user/verified/?err=true&message=${message}`);
              }
            })
            .catch((err) => {
              let message = "An error occurred while comparing unique strings";
              res.redirect(`/user/verified/?err=true&message=${message}`);
            });
        }
      } else {
        //user verification record doesn't exists
        let message =
          "Account record doesn't exists or has been verified already. Please sign up or log in.";
        res.redirect(`/user/verified/?err=true&message=${message}`);
      }
    })
    .catch((err) => {
      console.log(err);
      let message =
        "An error occurred while checking for exisitng user verification record";
      res.redirect(`/user/verified/?err=true&message=${message}`);
    });
});

//verified page route
router.get("/verified", (req, res) => {
  const filepath = path.join(__dirname, "./../views/verified.html");
  res.sendFile(filepath ,(err)=>{
    if(err)
    {
      console.log(err);
    }
    else{
      console.log("file sent successfully");
    }
  });

});


//generate access tokens

const generateAccessToken  = (user) =>{
 return jwt.sign({id:user.id},process.env.SECRET_KEY,{expiresIn : "15m"})
          
}


const generateRefreshToken  = (user) =>{
 return jwt.sign({id:user.id},process.env.SECRET_KEY_REFRESH,{expiresIn : "15m"});
            
}

//signin
router.post("/signin", (req, res) => {
  let { email, password } = req.body;
  email = email?.trim();
  password = password?.trim();

  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty Credentials",
    });
  } else {
    User.find({ email })
      .then((data) => {
        if (data.length) {
          // User exists
          const user = data[0];
          if (user) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            refreshTokens.push(refreshToken);

            // Send a single response
            res.json({
              id: user.id,
              email: user.email,
              status: "SUCCESSFUL",
              accessToken,
              refreshToken,
            });
          } else {
            // Check if user is verified
            if (!data[0].verified) {
              // Send a single response
              res.json({
                status: "FAILED",
                message: "Email hasn't been verified. Check your inbox.",
              });
            } else {
              const hashedPassword = data[0].password;
              bcrypt
                .compare(password, hashedPassword)
                .then((result) => {
                  if (result) {
                    // Successfully signed in
                    // You can send additional response here if needed
                  } else {
                    // Send a single response
                    res.json({
                      status: "FAILED",
                      message: "Invalid Password Entered",
                    });
                  }
                })
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    message: "An error occurred while comparing passwords",
                  });
                });
            }
          }
        } else {
          // Send a single response
          res.json({
            status: "FAILED",
            message: "Invalid Credentials!",
          });
        }
      })
      .catch((err) => {
        // Send a single response
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for existing users",
        });
      });
  }
});



router.post('/requestPasswordReset',(req,res) =>{
  const {email,redirectUrl}=req.body;

  User.find({email})
  .then((data)=>{
    if(data.length){
      sendResetEmail(data[0],redirectUrl,res);
       
      // if(!data[0].verified)
      // {
      //   res.json({
      //     status: "FAILED",
      //     message: "Email Not verified",
      //   });
      // }
      // else{
        
      // }
    }
    else{
      res.json({
        status: "FAILED",
        message: "No account with the supplied email exists",
      });
    }
  })
  .catch(error =>{
    console.log(error);
    res.json({
      status: "FAILED",
      message: "An error occurred while checking for existing users",
    });
  })
})

const sendResetEmail = ({_id,email},redirectUrl,res)=>{
  const resetString = uuidv4 + _id;
  PasswordReset.deleteMany({userId:_id})
  .then(result =>{

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Password Reset",
      html: `<p>Lost Password!</p><p>use this link to reset password , expires in 60 minutes</p>
              <p>Press <a href=${
                redirectUrl + "/" + _id + "/" + resetString
              }>here</a> to procedd.</p>`,
    };

    const saltRounds = 10;
    bcrypt.hash(resetString,saltRounds).
    then(hashedResetString =>{
      const newPasswordReset =new PasswordReset({
        userId: _id,
        resetString:hashedResetString,
        creadtedAt: Date.now(),
        expiresAt:Date.now() + 3600000
      });

      newPasswordReset.save()
      .then(()=>{
        transporter.sendMail(mailOptions)
        .then(()=>{
          res.json({
            status: "PENDING",
            message: "Password reset email sent",
          });
        })
        .catch(err =>{
          console.log(err);
          res.json({
            status: "FAILED",
            message: "Password email reset failed",
          });
        })
      })
      .catch(error =>{
        console.log(error);
        res.json({
          status: "FAILED",
          message: "Couldnot reset password",
        });
      })
    })
    .catch(error =>{
      console.log(error);
      res.json({
        status: "FAILED",
        message: "Error occurred while hashing password",
      });
    })

  })
  .catch(error =>{
    console.log(error);
    res.json({
      status: "FAILED",
      message: "Clearing existing user records failed",
    });
  })
}

// router.post('/profile',verifytoken,(req,res)=>{
    
//       try{
//         jwt.verify(req.token,secretKey,(err,authData)=>{
//           if(err)
//           {
//             res.send({result:"Invalid Token"});
//           }
//           else{
//             res.json({message:"profile accessed",
//             authData
//           })
//           }
//         })
//       }catch(err){
//         res.send({result:"Invalid Token"});

// }    
// });
const verify = (req,res,next) =>{
  const authHeader = req.headers.authorization;
  if(authHeader){
     const token = authHeader.split(" ")[1]; 
     jwt.verify(token,process.env.SECRET_KEY,(err,user) =>{
      if(err){
        return res.status(403).json("Token is not Valid!");
      }
      req.user = user;
      next();
     })
  }
  else{
    res.status(401).json("You are not authenticated!");
  }
}




router.post("/refresh",(req,res)=>{
    //take refresh token from the user
    const refreshToken = req.body.token;

    //send error if there is no token or it's invalid
    if(!refreshToken) {
      return res.status(401).json("You are not authenticated!")
    }
    if(!refreshTokens.includes(refreshToken)){
       return res.status(403).json("Refresh Token is not valid!");
    }

    jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH,(err,user)=>{
      err && console.log(err);

      refreshTokens = refreshTokens.filter((token)=> token !== refreshToken);

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      refreshTokens.push(newRefreshToken);

      res.status(200).json({
        accessToken: newAccessToken ,
        refreshToken : newRefreshToken,
      })

    });

    //if everything is ok , create new access token , refresh token and send to user
})

router.delete("/del/:id",verify,async (req,res)=>{
  
  try {
    if (req.user.id === req.params.id) {
      const deletedUser = await User.findOneAndDelete({ _id: req.params.id });
      if (deletedUser) {
        // User was found and deleted successfully
        res.status(200).json({ message: "User has been deleted" });
      } else {
        // User was not found
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.status(200).json("User Not deleted");
    }
  } catch (err) {
    // Handle any errors that occur during the deletion
    res.status(500).json({ message: "User deletion failed" });
  }
})

module.exports = router;
