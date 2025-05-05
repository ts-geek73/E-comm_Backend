import { Request, Response } from 'express';
import { User } from '../models';
import { UserData } from '../types';
import dotenv from 'dotenv';

dotenv.config();


// import jwt, { JwtPayload } from 'jsonwebtoken';
// import jwksClient from 'jwks-rsa';

// const JWKS_URI = process.env.JWKS_URI || '';
// const JWT_ISSUER = process.env.JWT_ISSUER || '';

// const client = jwksClient({
//   jwksUri: JWKS_URI,
// });

// let cachedPublicKeys: { [key: string]: string } = {};

// async function getLocalKey(header: any): Promise<string | null> {
//   const kid = header.kid;

//   if (cachedPublicKeys[kid]) {
//     return cachedPublicKeys[kid];
//   }

//   try {
//     const key = await client.getSigningKey(kid);
//     const publicKey = key?.getPublicKey();
//     if (publicKey) {
//       cachedPublicKeys[kid] = publicKey; 
//       return publicKey;
//     }
//     return null;
//   } catch (error) {
//     console.error('Error fetching signing key:', error);
//     return null;
//   }
// }

const UserController = {

  createUser: async (req: Request, res: Response) => {
    try {
      console.log("enter in create api");

      const userData: UserData = req.body;
      console.log("Body", userData);


      const { email, name, sessionId, clerkId, userId } = userData;

      if (!clerkId || !userId || !name || !email || !sessionId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      console.log("Pass1");
      await User.findOneAndUpdate(
        { userId: userId },
        userData,
        { upsert: true, new: true }
      );

      console.log("Pass1");



      console.log("User Update SuccessFully");

      return res.status(201).json({ message: 'User data stored successfully' });
    } catch (error: any) {
      console.error('Error storing user data:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  protected: async (req: Request, res: Response) => {
    try {
      console.log("Protected APi ");

      // const authHeader = req.headers.authorization;
      // if (!authHeader) {
      //   console.log("No Auth");

      //   return res.status(401).json({ message: 'No token provided' });
      // }

      // const token = authHeader.split(" ")[1];

      // try {
      //   const decoded = jwt.decode(token, { complete: true });
      //   if (!decoded || !decoded.header) {
      //     return res.status(401).json({ message: 'Invalid token structure' });
      //   }

      //   const publicKey = await getLocalKey(decoded.header);
      //   if (!publicKey) {
      //     return res.status(401).json({ message: 'Invalid token signature' });
      //   }

      //   const decodedPayload = jwt.verify(token, publicKey, { issuer: JWT_ISSUER }) as JwtPayload;

      //   const user = await User.findOne({ userId: decodedPayload.sub });
      //   if (!user) {
      //     console.log("User Found !!");

      //     return res.status(404).json({ message: 'User not found' });
      //   }

      // if (user.roles && user.roles.includes('Admin')) {
      //   console.log("Admin");

      //   return res.status(200).json({ message: 'User authenticated' });
      // } else {
      //   console.log("not a Admin");
      //   return res.status(401).json({ message: 'User does not have admin access' });
      // }
      res.status(200).json({ message: 'User authenticated' });
      // } catch (jwtError) {
      //   console.error('JWT verification error:', jwtError);
      //   return res.status(401).json({ message: 'Invalid token' });
      // }
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).send('Internal Server Error');
    }
  },
};

export default UserController;
