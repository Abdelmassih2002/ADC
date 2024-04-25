exports.updateInfo = catchAsync(async (req, res, next) => {
  const { firstName, lastName, gender, phoneNumber, weight, height } = req.body;
  const token = req.body.token;
  console.log(token);
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.data[0];
    const updatedData = decodedToken.data;
    console.log(updatedData);
    await db.collection("users").doc(userEmail).update({
      firstName,
      lastName,
      gender,
      phoneNumber,
      weight,
      height,
    });
    // Send response with updated user info and token
    res.send("User info updateddd successfully");
    createSendToken(updatedData, 200, req, res);
  } catch (error) {
    console.error("Error updating update info:", error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});
