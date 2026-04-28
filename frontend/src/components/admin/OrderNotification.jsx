import { useEffect, useRef, useState } from 'react';
import { Bell, X, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { orderAPI } from '../../services/api';

// Generate notification sound using Web Audio API - Food delivery notification
function generateNotificationSound() {
  if (typeof window === 'undefined') return;
  
  window.playNotificationSound = function() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Food delivery app style notification - friendly ding!
      // Play 3 pleasant notes like a happy notification
      const notes = [
        { freq: 698.46, time: 0 },      // F5 - friendly
        { freq: 880, time: 0.1 },       // A5 - uplifting  
        { freq: 1046.50, time: 0.2 }    // C6 - celebration!
      ];
      
      notes.forEach(({ freq, time }) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = now + time;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.45);
      });
      
      return true;
    } catch (e) {
      console.log('Audio error:', e);
      return false;
    }
  };
}

// Initialize on module load
generateNotificationSound();

export default function OrderNotification({ onOrderClick }) {
  const [notification, setNotification] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const timeoutRef = useRef(null);
  const { socket } = useSelector(state => state.admin);
  const soundIntervalRef = useRef(null);

  const handleUpdatePrepTime = async (orderId, newTime) => {
    try {
      await orderAPI.updatePreparationTime(orderId, newTime);
      setNotification(prev => ({
        ...prev,
        order: { ...prev.order, preparationTime: newTime }
      }));
    } catch (error) {
      console.error('Failed to update preparation time:', error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('new-order', (data) => {
        setNotification(data);
        setShowPopup(true);
        
        // Play sound repeatedly for 2 minutes
        playSoundRepeated();
        
        // Auto hide popup after 2 minutes
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setShowPopup(false);
          stopSound();
        }, 120000); // 2 minutes
      });
    }

    return () => {
      if (socket) {
        socket.off('new-order');
      }
      stopSound();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [socket]);

  const playSoundRepeated = () => {
    stopSound();
    // Play sound every 3 seconds for 2 minutes
    if (window.playNotificationSound) {
      window.playNotificationSound();
      soundIntervalRef.current = setInterval(() => {
        window.playNotificationSound();
      }, 3000);
    }
  };

  const stopSound = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    stopSound();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleViewOrder = () => {
    stopSound();
    if (onOrderClick && notification?.order) {
      onOrderClick(notification.order);
    }
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <>
      <div className="fixed top-4 right-4 z-50 animate-slide-in">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-primary-500/20 overflow-hidden w-80">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bell className="animate-bounce" size={20} />
              <span className="font-semibold">New Order! 🔔</span>
            </div>
            <button 
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            {notification?.order && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={14} />
                  <span>Order #{notification.order.orderNumber}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount:</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    ₹{notification.order.totalAmount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Prep Time:</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTime = Math.max(5, (notification.order.preparationTime || 15) - 5);
                        handleUpdatePrepTime(notification.order._id, newTime);
                      }}
                      className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm px-2">{notification.order.preparationTime || 15} min</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTime = (notification.order.preparationTime || 15) + 5;
                        handleUpdatePrepTime(notification.order._id, newTime);
                      }}
                      className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {notification.order.deliveryAddress && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium">{notification.order.deliveryAddress.fullName}</p>
                    <p className="text-xs truncate">{notification.order.deliveryAddress.fullAddress}</p>
                  </div>
                )}

                <button
                  onClick={handleViewOrder}
                  className="w-full mt-2 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Order</span>
                  <Bell size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="h-1 bg-gray-200 dark:bg-gray-700">
            <div className="h-full bg-primary-500 animate-shrink" style={{ animationDuration: '2m' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-shrink {
          animation: shrink 120s linear forwards;
        }
      `}</style>
    </>
  );
}