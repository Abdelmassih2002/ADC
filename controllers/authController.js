const { db, admin } = require("../models/db");
const firestore = admin.firestore();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AppError = require(".././utils/appError");
const catchAsync = require(".././utils/catchAsync");
const sendEmail = require("./../utils/Email");
const functions = require('firebase-functions');
let counter = 1;


function signToken(...data) {
  return jwt.sign({ data }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(
    user.email,
    user.firstName,
    user.lastName,
    user.gender,
    user.phoneNumber,
    user.weight,
    user.height,
    user.age
  );
  user.password = undefined;
  // Send the token along with the response
  res.status(statusCode).json({
    status: "success",
    token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  try {
    const data = ({ email, password, passwordConfirm, phoneNumber } = req.body);
    const hashedPassword = await bcrypt.hash(password, 12);

    if (!(email && password && phoneNumber && passwordConfirm)) {
      return res.status(400).json({
        error: "All fields must be filled",
      });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({
        error: "Passwords do not match",
      });
    }
    const userDoc = await db.collection("users").doc(email).get();
    if (userDoc.exists) {
      return res.status(400).json({
        error: "Email already exists",
      });
    }
    await db.collection("users").doc(email).set({
      email,
      password: hashedPassword,
      phoneNumber,
    });
    await db.collection("readings").doc(email).set({});
    createSendToken(data, 200, req, res);
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  try {
    const user = await db.collection("users").where("email", "==", email).get();
    if (user.empty) {
      return next(new AppError("Incorrect email or password", 401));
    }
    const userDocument = user.docs[0];
    global.userData = userDocument.data();
    const hashedPassword = userData.password;
    const correctPassword = await bcrypt.compare(password, hashedPassword);

    if (!correctPassword) {
      return next(new AppError("Incorrect email or password", 401));
    }
    console.log("Login successfully");
    createSendToken(userData, 200, req, res);
    // Call updateReading immediately
    updateReading();
  } catch (err) {
    return next(new AppError("Authentication failed", 500));
  }
});

// Define counter globally outside the function

// Increment counter function
const updateReading = () => {
  const userId = userData.email;

  // Listen for changes in the Firebase Realtime Database
  admin
    .database()
    .ref("/test/int")
    .on("value", (snapshot) => {
      const bloodGlucoseValue =parseInt( snapshot.val());

      // Update Firestore only when data changes
      const fieldKey = "Reading " + counter;
      const readingDocRef = firestore.collection("readings").doc(userId);
      readingDocRef
        .update({
          [fieldKey]: bloodGlucoseValue,
        })
        .then(() => {
          console.log("Blood glucose value updated successfully in Firestore");
          incrementCounter();
        })
        .catch((error) => {
          console.error("Error updating blood glucose value in Firestore:", error);
        });
    });
};
const incrementCounter = () => {
  counter++;
  if (counter === 13) {
    const userId = userData.email;
    const readingDocRef = firestore.collection("readings").doc(userId);
    const newDocRef = firestore.collection("readingGraph").doc(userId);

    // Get the data from readings collection
    readingDocRef.get().then((doc) => {
      if (doc.exists) {
        // Move data to readingGraph collection
        newDocRef.set(doc.data()).then(() => {
          console.log("Data moved to readingGraph collection");
        }).catch((error) => {
          console.error("Error moving data to readingGraph collection:", error);
        });
      } else {
        console.log("No data found in readings collection");
      }
    }).catch((error) => {
      console.error("Error getting document:", error);
    });
    // Reset counter
    counter = 1;
  }
};

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.userInfo = catchAsync(async (req, res, next) => {
  const { firstName, lastName, age, gender, weight, height } = req.body;
  const token = req.body.token;

  if (!(firstName && lastName && age && gender && weight && height)) {
    return res.status(400).json({
      error: "All fields must be filled",
    });
  }

  try {
    // Verify and decode the token to get user email and other data
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.data[0];
    const allData = {
      email: userEmail, // Include the email in updated data
      firstName,
      lastName,
      age,
      gender,
      weight,
      height,
    };

    // Update user info in the database
    await db.collection("users").doc(userEmail).update(allData);

    // Send the token with updated user data
    createSendToken(allData, 200, req, res);
  } catch (error) {
    console.error("Error updating user info:", error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

exports.updateInfo = catchAsync(async (req, res, next) => {
  const { firstName, lastName, gender, phoneNumber, weight, height } = req.body;
  const token = req.body.token;

  try {
    // Verify and decode the token to get user email
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.data[0];
    const updatedData = {
      email: userEmail, // Include the email in updated data
      firstName,
      lastName,
      gender,
      phoneNumber,
      weight,
      height,
    };

    // Update user info in the database
    await db.collection("users").doc(userEmail).update(updatedData);

    // Refresh token with updated user data
    createSendToken(updatedData, 200, req, res);
  } catch (error) {
    console.error("Error updating user info:", error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { email, currentPassword, newPassword, newPasswordConfirm } = req.body;
  
  try {
    // Check if all required fields are provided
    if (!(email && currentPassword && newPassword && newPasswordConfirm)) {
      return res.status(400).json({
        error: "All fields must be filled",
      });
    }

    // Find the user by email
    const user = await db.collection("users").doc(email).get();

    // Check if the user exists
    if (!user.exists) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Get user data
    const userData = user.data();

    // Check if the current password matches
    const currentPasswordCorrect = await bcrypt.compare(currentPassword, userData.password);

    if (!currentPasswordCorrect) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    // Check if the new password and confirm password match
    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({
        error: "New passwords do not match",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password in the database
    await db.collection("users").doc(email).update({
      password: hashedPassword,
    });

    // Send response
    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.requestPasswordReset = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  try {
    // Check if the email exists in the database
    const user = await db.collection("users").doc(email).get();

    if (!user.exists) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Generate a unique token for password reset
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Save the reset token and its expiration time in the user's document
    await db.collection("users").doc(email).update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: Date.now() + 3600000, // Token expires in 1 hour
    });

    res.status(200).json({
      status: "success",
      message: "Password reset token sent to email",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { newPassword, newPasswordConfirm, resetToken } = req.body;

  try {
    // Find the user by the reset token
    const userQuery = await db.collection("users").where("resetPasswordToken", "==", resetToken).get();

    if (userQuery.empty) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check if the reset token has expired
    if (userData.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        error: "Reset token has expired",
      });
    }

    // Check if the new password and confirm password match
    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({
        error: "New passwords do not match",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password and clear the reset token fields in the database
    await db.collection("users").doc(userDoc.id).update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    // Send response
    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
