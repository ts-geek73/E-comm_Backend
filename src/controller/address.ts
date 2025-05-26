import { Request, Response } from "express";
import { sendErrorResponse, sendSuccessResponse } from "../functions/product";
import { Address } from "../models";
import { IAddressEntry, IRequestHandler } from "../types";

const CartController: IRequestHandler = {
    getAddresses: async (req: Request, res: Response) => {
        try {
            console.log("Get All the Address");

            const { email } = req.query;
            if (!email) {
                return sendErrorResponse(res, {
                    message: "Email is required",
                    details: "Missing email in request body",
                }, 400);
            }

            const userAddress = await Address.findOne({ email });

            if (!userAddress) {
                return sendSuccessResponse(res, { addresses: [] }, "No addresses found", 200);
            }

            sendSuccessResponse(res, { addresses: userAddress.addresses }, "Addresses retrieved successfully", 200);

        } catch (error: any) {
            sendErrorResponse(res, {
                message: "Address Error",
                details: error.message,
            }, 500);
        }
    },
    deleteAddress: async (req: Request, res: Response) => {
        try {
            console.log("call for delete");

            const { address } = req.body;
            const { email } = req.query

            if (!email) {
                return sendErrorResponse(res, {
                    message: "Email is required to delete",
                    details: "Invalid request payload",
                }, 400);
            }

            if (!address) {
                return sendErrorResponse(res, {
                    message: "address to delete are required",
                    details: "Invalid request payload",
                }, 400);
            }


            const userAddress = await Address.findOne({ email });

            if (!userAddress) {
                return sendErrorResponse(res, {
                    message: "User not found",
                    details: "No address record exists for this email",
                }, 404);
            }

            console.log("address want to delete", address);
            console.log("All User Address", userAddress.addresses);



            const updatedAddresses = userAddress.addresses.filter(
                (addr) => addr._id.toString() !== address._id
            );

            console.log("new address:=", updatedAddresses);


            userAddress.addresses = updatedAddresses;
            await userAddress.save();

            sendSuccessResponse(res, { addresses: updatedAddresses }, "Address deleted successfully", 200);
        } catch (error: any) {
            sendErrorResponse(res, {
                message: "Failed to delete address",
                details: error.message,
            }, 500);
        }
    },
    saveOrUpdateAddresses: async (req: Request, res: Response) => {
        try {
            const { email, addresses } = req.body;
            console.log("body", addresses);


            if (!email || !Array.isArray(addresses)) {
                return sendErrorResponse(res, {
                    message: "Invalid payload",
                    details: "Email and addresses array are required",
                }, 400);
            }

            console.log("pass1");
            const existing = await Address.findOne({ email });
            console.log("pass1");

            function areAddressesEqual(a: IAddressEntry, b: IAddressEntry) {
                return (
                    a.address === b.address &&
                    a.city === b.city &&
                    a.zip === b.zip &&
                    a.country === b.country &&
                    a.state === b.state &&
                    a.addressType === b.addressType
                );
            }


            if (existing) {
                const existingAddresses = existing.addresses;

                const uniqueNewAddresses = addresses.filter(
                    (newAddr: IAddressEntry) =>
                        !existingAddresses.some((existingAddr) => areAddressesEqual(existingAddr, newAddr))
                );

                console.log("pass2");
                if (uniqueNewAddresses.length > 0) {
                    console.log("if pass2", uniqueNewAddresses);
                    existing.addresses.push(...uniqueNewAddresses);
                    await existing.save();
                }
                console.log("pass2");

                return sendSuccessResponse(res, { addresses: existing.addresses }, 'Addresses updated successfully', 200);
            } else {
                console.log("pass3");
                const newAddress = new Address({ email, addresses });
                await newAddress.save();

                console.log("pass3");
                return sendSuccessResponse(res, { addresses: newAddress.addresses }, 'Addresses added successfully', 201);
            }
        } catch (error: any) {
            sendErrorResponse(res, {
                message: "Failed to save/update addresses",
                details: error.message,
            }, 500);
        }
    }
};

export default CartController;

