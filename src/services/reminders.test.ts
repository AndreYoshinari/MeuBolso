import { syncFinancialReminder, type ReminderPort } from '@/services/reminders';

function port(granted: boolean): ReminderPort & {
  scheduled: { day: number; hour: number }[];
  cancelled: number;
} {
  const scheduled: { day: number; hour: number }[] = [];
  let cancelled = 0;
  const reminder = {
    scheduled,
    get cancelled() {
      return cancelled;
    },
    getPermission: async () => granted,
    requestPermission: async () => granted,
    scheduleMonthly: async (input: { day: number; hour: number }) => {
      scheduled.push(input);
    },
    cancel: async () => {
      cancelled += 1;
    },
  };

  return reminder;
}

test('schedules a monthly reminder when permission is granted', async () => {
  const reminder = port(true);

  await expect(
    syncFinancialReminder(
      { notificationsEnabled: true, reminderDay: 5, reminderHour: 18 },
      'request',
      reminder,
    ),
  ).resolves.toBe('scheduled');
  expect(reminder.scheduled).toEqual([{ day: 5, hour: 18 }]);
});

test('cancels the reminder when notifications are off or permission is denied', async () => {
  const disabled = port(true);

  await expect(
    syncFinancialReminder(
      { notificationsEnabled: false, reminderDay: 1, reminderHour: 9 },
      'quiet',
      disabled,
    ),
  ).resolves.toBe('disabled');
  expect(disabled.cancelled).toBe(1);
  expect(disabled.scheduled).toEqual([]);

  const denied = port(false);

  await expect(
    syncFinancialReminder(
      { notificationsEnabled: true, reminderDay: 1, reminderHour: 9 },
      'request',
      denied,
    ),
  ).resolves.toBe('denied');
  expect(denied.cancelled).toBe(1);
  expect(denied.scheduled).toEqual([]);
});
