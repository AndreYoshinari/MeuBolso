export type ReminderRequest = {
  notificationsEnabled: boolean;
  reminderDay: number;
  reminderHour: number;
};

export type ReminderSync = 'scheduled' | 'disabled' | 'denied';

export type ReminderPort = {
  getPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  scheduleMonthly: (input: { day: number; hour: number }) => Promise<void>;
  cancel: () => Promise<void>;
};

const reminderId = 'financial-reminder';

export async function syncFinancialReminder(
  request: ReminderRequest,
  mode: 'request' | 'quiet' = 'quiet',
  port?: ReminderPort,
): Promise<ReminderSync> {
  const resolved = port ?? (await createExpoReminderPort());

  if (!request.notificationsEnabled) {
    await resolved.cancel();
    return 'disabled';
  }

  const granted =
    mode === 'request'
      ? await resolved.requestPermission()
      : await resolved.getPermission();

  if (!granted) {
    await resolved.cancel();
    return 'denied';
  }

  await resolved.scheduleMonthly({
    day: request.reminderDay,
    hour: request.reminderHour,
  });

  return 'scheduled';
}

async function createExpoReminderPort(): Promise<ReminderPort> {
  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  return {
    async getPermission() {
      const current = await Notifications.getPermissionsAsync();
      return current.granted;
    },
    async requestPermission() {
      const current = await Notifications.getPermissionsAsync();

      if (current.granted) {
        return true;
      }

      const requested = await Notifications.requestPermissionsAsync();
      return requested.granted;
    },
    async scheduleMonthly(input) {
      await Notifications.cancelScheduledNotificationAsync(reminderId).catch(
        (error: unknown) => {
          console.error(
            'notifications',
            error instanceof Error ? error.name : 'unknown',
          );
        },
      );
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId,
        content: {
          title: 'MeuBolso',
          body: 'Hora de revisar seus lançamentos.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: input.day,
          hour: input.hour,
          minute: 0,
        },
      });
    },
    async cancel() {
      await Notifications.cancelScheduledNotificationAsync(reminderId).catch(
        (error: unknown) => {
          console.error(
            'notifications',
            error instanceof Error ? error.name : 'unknown',
          );
        },
      );
    },
  };
}
