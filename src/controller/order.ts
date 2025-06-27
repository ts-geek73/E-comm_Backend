import { Request, Response } from 'express';
import { getProductDetails, sendErrorResponse, sendSuccessResponse } from '../functions/product';
import { Order, User, UserInvoice } from '../models';
import stripe from '../service/stripe';

const OrderController = {
  getOrderAndInvoiceFunction: async (req: Request, res: Response): Promise<void> => {
    const {
      orderId,
      email,
      invoices,
      page = '1',
      limit = '12',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      search,
      dateFrom,
      dateTo
    } = req.query;

    try {
      console.log("Incoming request:", {
        orderId,
        email,
        invoices,
        page,
        limit,
        sortBy,
        sortOrder,
        status,
        search,
        dateFrom,
        dateTo
      });

      // 1. Get a single order and receipt
      if (orderId) {
        console.log("case 1:=", orderId);

        const order = await Order.findById(orderId).populate([
          { path: 'billing_address' },
          { path: 'shipping_address' },
          {
            path: 'items.product_id',
            select: 'name price image',
          }
        ]).lean();

        if (!order) {
          sendErrorResponse(res, { message: 'Order not found' }, 404);
          return;
        }

        const itemsWithProduct = await Promise.all(
          order.items.map(async (item: any) => {
            const product = await getProductDetails(item.product_id, req);
            const { product_id, ...restItem } = item;
            return {
              ...restItem,
              product,
            };
          })
        );

        if (!order || !order.session_id) {
          sendErrorResponse(res, { message: 'Order or session not found' }, 404);
          return;
        }

        const session = await stripe.checkout.sessions.retrieve(order.session_id);
        const charges = await stripe.charges.list({
          payment_intent: session.payment_intent as string,
          limit: 1,
        });

        const receiptUrl = charges.data[0]?.receipt_url;
        const orderObj = order.toObject ? order.toObject() : order;
        orderObj.items = itemsWithProduct;

        sendSuccessResponse(res, { receiptUrl, order: orderObj }, 'Order and receipt fetched successfully', 200);
        return;
      }

      // 2. Get all orders by email with pagination, sorting, and filtering
      if (email && !invoices) {
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 12;
        const skip = (pageNum - 1) * limitNum;

        // Build query filter
        const queryFilter: any = { email };
        console.log("case 2:=", email);


        // Status filter
        if (status && status !== '') {
          queryFilter.status = status;
        }

        // Date range filter
        if (dateFrom || dateTo) {
          queryFilter.createdAt = {};
          if (dateFrom) {
            queryFilter.createdAt.$gte = new Date(dateFrom as string);
          }
          if (dateTo) {
            const endDate = new Date(dateTo as string);
            endDate.setHours(23, 59, 59, 999); // End of day
            queryFilter.createdAt.$lte = endDate;
          }
        }

        // Search filter (search in order number, customer info, etc.)
        if (search && search !== '') {
          queryFilter.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'billing_address.firstName': { $regex: search, $options: 'i' } },
            { 'billing_address.lastName': { $regex: search, $options: 'i' } },
            { 'shipping_address.firstName': { $regex: search, $options: 'i' } },
            { 'shipping_address.lastName': { $regex: search, $options: 'i' } },
          ];
        }

        // Build sort object
        const sortObj: any = {};
        const validSortFields = ['createdAt', 'totalAmount', 'status', 'orderNumber', 'updatedAt'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        if (sortField === "totalAmount") {
          sortObj["amount"] = sortDirection
        } else if (sortField === "orderNumber") {
          sortObj["_id"] = sortDirection
        }
        else {
          sortObj[sortField as string] = sortDirection;
        }

        // console.log('Query Filter:', queryFilter);
        // console.log('Sort Object:', sortObj);

        const totalCount = await Order.countDocuments(queryFilter);

        const orders = await Order.find(queryFilter)
          .populate([
            { path: 'billing_address' },
            { path: 'shipping_address' },
            {
              path: 'items.product_id',
              select: 'name price image',
            }
          ])
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum)
          .lean();

        // console.log(orders);


        if (!orders || orders.length === 0) {
          sendSuccessResponse(res, {
            items: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: pageNum,
          }, 'No orders found for this email', 200);
          return;
        }

        const updatedOrders = await Promise.all(
          orders.map(async (order) => {
            const updatedItems = await Promise.all(
              order.items.map(async (item: any) => {
                const product = await getProductDetails(item.product_id, req);
                const { product_id, ...restItem } = item;
                return {
                  ...restItem,
                  product,
                };
              })
            );

            order.items = updatedItems;
            return order;
          })
        );

        const totalPages = Math.ceil(totalCount / limitNum);
        // console.log(updatedOrders.length);


        sendSuccessResponse(res, {
          items: updatedOrders,
          totalCount,
          length: updatedOrders.length,
          totalPages,
          currentPage: pageNum,
        }, 'Orders fetched successfully', 200);
        return;
      }

      // 3. Get invoice history with pagination, sorting, and filtering
      if (invoices) {
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 12;
        const skip = (pageNum - 1) * limitNum;
        console.log("case 3:=", email);

        const userInvoices = await UserInvoice.findOne({ email }).populate({
          path: "invoices.orderId",
          select: "amount"
        });

        // console.log("userInvoices:=", JSON.stringify(userInvoices));


        if (!userInvoices || userInvoices.invoices.length === 0) {
          sendSuccessResponse(res, {
            items: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: pageNum,
          }, 'No invoices found for this user', 200);
          return;
        }

        let filteredInvoices = [...userInvoices.invoices];
        // console.log(filteredInvoices);


        // Apply date range filter
        if (dateFrom || dateTo) {
          filteredInvoices = filteredInvoices.filter((invoice: any) => {
            const invoiceDate = new Date(invoice.createdAt || invoice.date);
            let matchesDateRange = true;

            if (dateFrom) {
              matchesDateRange = matchesDateRange && invoiceDate >= new Date(dateFrom as string);
            }
            if (dateTo) {
              const endDate = new Date(dateTo as string);
              endDate.setHours(23, 59, 59, 999);
              matchesDateRange = matchesDateRange && invoiceDate <= endDate;
            }

            return matchesDateRange;
          });
        }

        // Apply search filter
        if (search && search !== '') {
          filteredInvoices = filteredInvoices.filter((invoice: any) => {
            const searchTerm = (search as string).toLowerCase();
            return (
              invoice.invoiceNumber?.toLowerCase().includes(searchTerm) ||
              invoice.orderId?.orderNumber?.toLowerCase().includes(searchTerm)
            );
          });
        }

        // Apply sorting
        const validSortFields = ['createdAt', 'invoiceNumber', 'totalAmount', 'date'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        // console.log(sortBy, sortField, sortDirection);


        filteredInvoices.sort((a: any, b: any) => {
          // console.log("a: ", a, " b:", b);

          // let aValue = a[sortField as string];
          // let bValue = b[sortField as string];

          // console.log(aValue,bValue);


          // // Handle date fields
          // if (sortField === 'createdAt' || sortField === 'date') {
          //   aValue = new Date(aValue || a.createdAt || a.date);
          //   bValue = new Date(bValue || b.createdAt || b.date);
          // }

          // // Handle string fields
          // if (typeof aValue === 'string') {
          //   aValue = aValue.toLowerCase();
          // }
          // if (typeof bValue === 'string') {
          //   bValue = bValue.toLowerCase();
          // }

          let aValue: any;
          let bValue: any;

          switch (sortField) {
            case 'totalAmount':
              aValue = a.orderId?.amount ?? 0;
              bValue = b.orderId?.amount ?? 0;
              break;
            case 'createdAt':
            case 'date':
              aValue = new Date(a.createdAt || a.date);
              bValue = new Date(b.createdAt || b.date);
              break;
            default:
              // aValue = a[sortField as string] ?? '';
              // bValue = b[sortField as string] ?? '';
              aValue = a._id
              bValue = b._id
              if (typeof aValue === 'string') aValue = aValue.toLowerCase();
              if (typeof bValue === 'string') bValue = bValue.toLowerCase();
              break;
          }


          if (aValue < bValue) return -1 * sortDirection;
          if (aValue > bValue) return 1 * sortDirection;
          return 0;
        });

        // console.log(filteredInvoices);


        const totalCount = filteredInvoices.length;
        const totalPages = Math.ceil(totalCount / limitNum);

        // Apply pagination
        const paginatedInvoices = filteredInvoices.slice(skip, skip + limitNum);

        const populatedInvoices = await Promise.all(
          paginatedInvoices.map(async (invoice: any) => {
            // Populate the orderId if it exists
            let populatedOrder = null;
            if (invoice.orderId) {
              populatedOrder = await Order.findById(invoice.orderId).populate([
                { path: 'billing_address' },
                { path: 'shipping_address' },
                {
                  path: 'items.product_id',
                  select: 'name price image',
                }
              ]).lean();
            }

            let enrichedOrder = null;

            // If orderId is populated and has items
            if (populatedOrder && populatedOrder?.items?.length > 0) {
              const enrichedItems = await Promise.all(
                populatedOrder.items.map(async (item: any) => {
                  const product = await getProductDetails(item.product_id, req);
                  const { product_id, ...restItem } = item;
                  return {
                    ...restItem,
                    product,
                  };
                })
              );

              enrichedOrder = {
                ...populatedOrder,
                items: enrichedItems,
              };
            }

            return {
              ...invoice.toObject(),
              orderId: enrichedOrder || populatedOrder,
            };
          })
        );

        sendSuccessResponse(res, {
          items: populatedInvoices,
          totalCount,
          totalPages,
          currentPage: pageNum,
        }, 'Invoices fetched successfully', 200);
        return;
      }

      // 4. Fallback
      sendErrorResponse(res, { message: 'Please provide a valid query parameter: orderId, email, or invoices' }, 400);
    } catch (err) {
      console.error('Error in order dataFunction:', err);
      sendErrorResponse(res, { message: 'Server error' }, 500);
    }
  },
  cancelOrReturnOrderFunction: async (req: Request, res: Response): Promise<void> => {
    try {
      const { order, user_id, userEmail, status } = req.body;

      if (!order || !order._id) {
        sendErrorResponse(res, { message: 'Order data missing or invalid' }, 400);
        return;
      }

      const user = await User.findOne({ userId:user_id });
      if (!user) {
        sendErrorResponse(res, { message: 'User not found' }, 404);
        return;
      }

      if (user.email !== userEmail) {
        sendErrorResponse(res, { message: 'Email mismatch. Unauthorized request.' }, 403);
        return;
      }

      const existingOrder = await Order.findById(order._id);
      if (!existingOrder) {
        sendErrorResponse(res, { message: 'Order not found' }, 404);
        return;
      }

      if (status === "cancel") {
        existingOrder.status = 'cancelled';
        await existingOrder.save();
        res.json({ success: true, message: 'Order cancelled successfully' });
        return;

      }
      else if (status === "return") {
        const orderDate = existingOrder.get('createdAt');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (orderDate < sevenDaysAgo) {
          sendErrorResponse(res, { message: 'Order return period (7 days) has expired.' }, 400);
          return;
        }

        existingOrder.status = 'return';
        await existingOrder.save();
        res.json({ success: true, message: 'Order returned successfully' });
        return;
      }

      sendErrorResponse(res, { message: 'Invalid route' }, 400);
    } catch (error) {
      console.error('Error in order dataFunction:', error);
      sendErrorResponse(res, { message: 'Server error' }, 500);

    }
  }
};

export default OrderController;
