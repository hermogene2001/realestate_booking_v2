import cron from 'node-cron';
import { BookingService } from '../services/booking.service';

export class BookingTimeoutWorker {
  private static cancelTask: cron.ScheduledTask | null = null;
  private static warningTask: cron.ScheduledTask | null = null;

  static start(): void {
    // Run every 15 minutes: cancel expired bookings
    BookingTimeoutWorker.cancelTask = cron.schedule('*/15 * * * *', async () => {
      try {
        const result = await BookingService.cancelExpiredBookings();
        if (result.cancelled > 0) {
          console.log(`[BookingTimeoutWorker] Cancelled ${result.cancelled} expired booking(s)`);
        }
      } catch (err) {
        console.error('[BookingTimeoutWorker] Error cancelling expired bookings:', err);
      }
    });

    // Run daily at 09:00 Africa/Kigali: send 72-hour timeout warnings
    BookingTimeoutWorker.warningTask = cron.schedule('0 9 * * *', async () => {
      try {
        const result = await BookingService.sendTimeoutWarnings();
        if (result.warned > 0) {
          console.log(`[BookingTimeoutWorker] Sent timeout warnings for ${result.warned} booking(s)`);
        }
      } catch (err) {
        console.error('[BookingTimeoutWorker] Error sending timeout warnings:', err);
      }
    }, { timezone: 'Africa/Kigali' });

    console.log('[BookingTimeoutWorker] Started');
  }

  static stop(): void {
    BookingTimeoutWorker.cancelTask?.stop();
    BookingTimeoutWorker.warningTask?.stop();
    BookingTimeoutWorker.cancelTask = null;
    BookingTimeoutWorker.warningTask = null;
    console.log('[BookingTimeoutWorker] Stopped');
  }
}
