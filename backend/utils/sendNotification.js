const axios = require('axios');

const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const serverKey = process.env.FCM_SERVER_KEY;
    
    if (!serverKey) {
      console.log('FCM Server Key not configured, skipping push notification');
      return { success: false, reason: 'FCM not configured' };
    }

    if (!fcmToken) {
      console.log('FCM Token not available, skipping push notification');
      return { success: false, reason: 'No FCM token' };
    }

    const payload = {
      to: fcmToken,
      notification: {
        title,
        body,
        sound: 'default',
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'order_updates',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await axios.post(FCM_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
      },
    });

    return { success: true, response: response.data };
  } catch (error) {
    console.error('FCM Push Notification Error:', error.message);
    return { success: false, error: error.message };
  }
};

const getOrderStatusMessage = (status, order) => {
  const messages = {
    pending: {
      title: 'Order Received',
      body: `Your order #${order.orderNumber} has been received and is waiting for confirmation.`,
    },
    preparing: {
      title: 'Order Preparing',
      body: `Your order #${order.orderNumber} is being prepared. Estimated time: ${order.preparationTime || 15} minutes.`,
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      body: `Your order #${order.orderNumber} is on its way! Estimated delivery: ${order.deliveryBoyEstimatedTime || 20} minutes.`,
    },
    delivered: {
      title: 'Order Delivered',
      body: `Your order #${order.orderNumber} has been delivered. Enjoy your meal!`,
    },
    cancelled: {
      title: 'Order Cancelled',
      body: `Your order #${order.orderNumber} has been cancelled.`,
    },
  };

  return messages[status] || { title: 'Order Update', body: `Order #${order.orderNumber} status: ${status}` };
};

module.exports = {
  sendPushNotification,
  getOrderStatusMessage,
};