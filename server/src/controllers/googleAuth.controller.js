import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { generateAccessAndRefreshTokens } from './user.controllers.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new ApiError(400, "Google credential token is required");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: name,
        avatar: picture,
        email,
        username: email.split("@")[0], // You can customize this logic
        password: googleId, // Store something unique (not used for password login)
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const safeUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: safeUser,
            accessToken,
            refreshToken,
          },
          "Google Sign-In Successful"
        )
      );
  } catch (err) {
    console.error("Google Sign-In error:", err);
    throw new ApiError(401, "Invalid Google credential");
  }
};

export { googleLogin };
