import { getDb } from '../_db.js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:leah@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await getDb();
  const settings = await db.collection('notification_settings').findOne({ _id: 'global' });

  const config = {
    appointmentEnabled: true,
    appointmentHoursBefore: 24,
    birthdayEnabled: true,
    birthdayDaysBefore: 0,
    ...settings,
  };

  const subscriptions = await db.collection('push_subscriptions').find({}).toArray();
  if (subscriptions.length === 0) {
    return res.status(200).json({ message: 'No subscriptions', sent: 0 });
  }

  const notifications = [];

  // --- Appointment reminders ---
  // Cron runs once daily at 05:00 UTC (08:00 Israel time)
  // Send reminders for all appointments happening within the next appointmentHoursBefore hours
  if (config.appointmentEnabled) {
    const now = new Date();
    const today = toDateStr(now);
    const tomorrow = toDateStr(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const dayAfter = toDateStr(new Date(now.getTime() + 48 * 60 * 60 * 1000));

    const appointments = await db.collection('appointments').find({
      deleted: { $ne: true },
      status: { $ne: 'cancelled' },
      date: { $gte: today, $lte: dayAfter },
    }).toArray();

    for (const appt of appointments) {
      const apptDateTime = new Date(`${appt.date}T${appt.time}:00`);
      const hoursUntil = (apptDateTime - now) / (1000 * 60 * 60);

      // Send for appointments within the reminder window that haven't passed
      if (hoursUntil > 0 && hoursUntil <= config.appointmentHoursBefore) {
        const hebrewDate = formatHebrewDate(appt.date);
        notifications.push({
          title: 'תזכורת תור',
          body: `${appt.clientName} - ${appt.type}, ${hebrewDate} ב-${appt.time}`,
          tag: `appt-${appt._id}`,
          data: { type: 'appointment', id: String(appt._id) },
        });
      }
    }
  }

  // --- Birthday reminders ---
  if (config.birthdayEnabled) {
    const now = new Date();
    const targetDate = new Date(now.getTime() + config.birthdayDaysBefore * 24 * 60 * 60 * 1000);
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();

    const clients = await db.collection('clients').find({
      deleted: { $ne: true },
      birthday: { $exists: true, $ne: null, $ne: '' },
    }).toArray();

    for (const client of clients) {
      const bday = new Date(client.birthday);
      if (bday.getMonth() + 1 === targetMonth && bday.getDate() === targetDay) {
        const age = targetDate.getFullYear() - bday.getFullYear();
        const dayLabel = config.birthdayDaysBefore === 0 ? 'היום' : `בעוד ${config.birthdayDaysBefore} ימים`;
        notifications.push({
          title: 'יום הולדת 🎂',
          body: `${client.name} חוגגת ${dayLabel}${age ? ` (${age})` : ''}`,
          tag: `bday-${client._id}-${targetMonth}-${targetDay}`,
          data: { type: 'birthday', id: String(client._id) },
        });
      }
    }
  }

  // --- Send notifications ---
  let sent = 0;
  let failed = 0;
  const expiredEndpoints = [];

  for (const notif of notifications) {
    const payload = JSON.stringify(notif);

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.subscription.endpoint);
        }
        failed++;
      }
    }
  }

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await db.collection('push_subscriptions').deleteMany({
      'subscription.endpoint': { $in: expiredEndpoints },
    });
  }

  return res.status(200).json({
    message: 'Done',
    notifications: notifications.length,
    sent,
    failed,
    cleaned: expiredEndpoints.length,
  });
}

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

function formatHebrewDate(dateStr) {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const d = new Date(dateStr + 'T00:00:00');
  return `יום ${days[d.getDay()]}`;
}
