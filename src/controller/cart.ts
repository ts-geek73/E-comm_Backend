import { Request, Response } from 'express';
import { sendErrorResponse, sendSuccessResponse } from '../functions/product';
import { ShoppingCart, Image } from '../models';
import { IRequestHandler, IShoppingCart } from '../types';
import { getAbsoluteImageUrl } from '../functions/image';

const CartController: IRequestHandler = {
  getCart: async (req: Request, res: Response) => {
    try {
      const user_id = req.query.user_id as string;
      console.log("Get Cart API");

      const cart = await ShoppingCart.findOne({ user_id }).populate({
        path: "products.product_id",
        select: "name price image",
      });

      if (!cart || cart.products.length === 0) {
        return sendSuccessResponse(res, {
          cart: [], totalItems: 0, totalPrice: 0
        }, "Cart is empty.", 200);
      }

      let totalItems = 0;
      let totalPrice = 0;

      const normalizeImage = (img: any) => ({
        ...img,
        url: getAbsoluteImageUrl(req, img.url)
      });


      const cartItems = await Promise.all(cart.products.map(async (item) => {
        const product = item.product_id as any;
        const itemTotal = product.price * item.qty;
        totalItems += item.qty;
        totalPrice += itemTotal;

        let normalizedImage = null;
        if (product.image) {
          const imageDoc = await Image.findById(product.image);
          if (imageDoc) {
            normalizedImage = normalizeImage(imageDoc);
          }
        }

        return {

          _id: product._id,
          name: product.name,
          price: product.price,
          image: normalizedImage,
          qty: item.qty,
          notes: item.notes || "",
          itemTotal,
        };
      }));

      sendSuccessResponse(res, {
        cart: cartItems,
        cartId: cart._id,
        totalItems,
        totalPrice,
      }, "Cart fetched successfully", 200);
    } catch (error: any) {
      console.error("Cart get error:", error);
      sendErrorResponse(res, {
        message: "Cart Error",
        details: error.message,
      }, 500);
    }
  },

  updateCart: async (req: Request, res: Response) => {
    try {
      const { user_id, product } = req.body;
      console.log("Update cart", product);

      const incomingProducts = Array.isArray(product) ? product : [product];

      let cart = await ShoppingCart.findOne({ user_id }) as IShoppingCart

      console.log("🚀 ~ updateCart: ~ cart:", cart)
      if (!cart) {
        cart = new ShoppingCart({ user_id, products: incomingProducts });
      } else {
        incomingProducts.forEach((incomingProduct) => {
          console.log("🚀 ~ incomingProducts.forEach ~ incomingProduct:", incomingProduct)
          const existingProduct = cart.products.find((p) =>
            p.product_id.toString() === incomingProduct.product_id
          );
          console.log("🚀 ~ incomingProducts.forEach ~ existingProduct:", existingProduct)

          if (existingProduct) {
            existingProduct.qty = incomingProduct.qty;
            existingProduct.notes = incomingProduct.notes || existingProduct.notes;
          } else {
            // Add new product
            cart.products.push(incomingProduct);
          }
        });
      }

      console.log("cart products:=", cart.products);

      await cart.save();
      sendSuccessResponse(res, { cart }, "Cart updated successfully");
    } catch (error: any) {
      console.error("Cart update error:", error);
      sendErrorResponse(
        res,
        {
          message: "Failed to update the cart",
          details: error.message,
        },
        500
      );
    }
  },

  removeItemfromCart: async (req: Request, res: Response) => {
    try {
      const { user_id, product_id } = req.body;

      const cart = await ShoppingCart.findOne({ user_id });

      if (!cart) {
        return sendErrorResponse(res, {
          message: "Cart Error",
          details: "Cart is empty.",
        }, 404);
      }

      cart.products = cart.products.filter((item) => item.product_id.toString() !== product_id);
      await cart.save();

      sendSuccessResponse(res, { cart }, "Item removed from cart", 200);
    } catch (error: any) {
      console.error("Cart remove error:", error);
      sendErrorResponse(res, {
        message: "Failed to remove item from cart",
        details: error.message,
      }, 500);
    }
  },

  clearCart: async (req: Request, res: Response) => {
    try {
      const { user_id } = req.body;

      const cart = await ShoppingCart.findOne({ user_id });

      if (!cart) {
        return sendErrorResponse(res, {
          message: "Cart Error",
          details: "Cart is empty.",
        }, 404);
      }

      cart.products = [];
      await cart.save();

      sendSuccessResponse(res, {}, "Cart cleared successfully", 200);
    } catch (error: any) {
      console.error("Clear cart error:", error);
      sendErrorResponse(res, {
        message: "Failed to clear cart",
        details: error.message,
      }, 500);
    }
  },
};

export default CartController;
