import { Request, Response } from 'express';
import otpGenerator from 'otp-generator';
import { sendErrorResponse, sendSuccessResponse } from '../functions/product';
import { OTP, User } from "../models";
import { mailSender } from "../service/node-mailer";
import { IRequestHandler } from "../types";

async function sendVerificationEmail(email: string, otp: string) {
    try {
        console.log("Email function call");

        await mailSender(
            email,
            "Verification Email",
            `<h1>Please confirm your OTP</h1>
       <p>Here is your OTP code: ${otp}</p>`
        );
        console.log("Email sent successfully: ");
    } catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
    }
}

const OTP_EXPIRY_DURATION_MS = 15 * 60 * 1000;
const OTPCOntroller: IRequestHandler = {
    sendOtp: async (req: Request, res: Response) => {
        try {
            const { email } = req.query;
            const OTP_EXPIRY_DURATION_MS = 15 * 60 * 1000;

            if (!email) {
                sendErrorResponse(res, {
                    message: "OTP generate error",
                    details: "Email and user must be provided",
                }, 400);
                return;
            }

            const user = await User.findOne({ email });
            if (!user) {
                sendErrorResponse(res, {
                    message: "User not found",
                    details: "User not found with the provided email",
                }, 401);
                return;
            }

            const existingOtp = await OTP.findOne({ email });
            if (existingOtp) {
                const now = new Date();
                const expiryTime = new Date(existingOtp.createdAt.getTime() + OTP_EXPIRY_DURATION_MS);
                if (expiryTime > now) {
                    console.log("Old OTP");
                    console.log(existingOtp.otp);

                    sendSuccessResponse(res, { otp: existingOtp.otp }, "OTP already sent recently. Please wait.", 200);
                    return;
                } else {
                    await OTP.deleteOne({ _id: existingOtp._id });
                }
            }

            let otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });

            let otpExists = await OTP.findOne({ otp });
            while (otpExists) {
                otp = otpGenerator.generate(6, {
                    upperCaseAlphabets: false,
                    lowerCaseAlphabets: false,
                    specialChars: false,
                });
                otpExists = await OTP.findOne({ otp });
            }

            const expiresAt = new Date(Date.now() + OTP_EXPIRY_DURATION_MS);

            await OTP.create({
                email,
                otp, // stored as plain text now
                expiresAt,
            });

            console.log("New OTP");

            await sendVerificationEmail(email as string, otp);

            sendSuccessResponse(res, { otp }, "OTP sent successfully", 200);
        } catch (error: any) {
            console.error("error in otp send", error);
            sendErrorResponse(res, {
                message: "Send OTP Error",
                details: error.message,
            }, 500);
        }
    },

    verifyOtp: async (req: Request, res: Response) => {
        try {
            const { email, otp } = req.body;
            const OTP_EXPIRY_DURATION_MS = 15 * 60 * 1000;

            if (!email || !otp) {
                sendErrorResponse(res, {
                    message: "Verification Failed",
                    details: "Email and OTP are required",
                }, 400);
                return;
            }

            const existingOtp = await OTP.findOne({ email });

            if (!existingOtp) {
                sendErrorResponse(res, {
                    message: "OTP not found",
                    details: "No OTP request found for this email",
                }, 404);
                return;
            }

            const now = new Date();
            const expiryTime = new Date(existingOtp.createdAt.getTime() + OTP_EXPIRY_DURATION_MS);
            if (expiryTime < now) {
                await OTP.deleteOne({ _id: existingOtp._id });

                sendErrorResponse(res, {
                    message: "OTP Expired",
                    details: "The OTP has expired. Please request a new one.",
                }, 410);
                return;
            }

            if (otp !== existingOtp.otp) {
                sendErrorResponse(res, {
                    message: "Invalid OTP",
                    details: "The provided OTP is incorrect.",
                }, 401);
                return;
            }

            await OTP.deleteOne({ _id: existingOtp._id });

            sendSuccessResponse(res, {
                verified: true,
                email,
            }, "OTP verified successfully", 200);
        } catch (error: any) {
            console.error("error in verify", error);
            sendErrorResponse(res, {
                message: "Verify OTP Error",
                details: error.message,
            }, 500);
        }
    }
};


export default OTPCOntroller;