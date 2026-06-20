import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '';

// Инициализация
export const initAmplitude = () => {
  if (AMPLITUDE_API_KEY) {
    amplitude.init(AMPLITUDE_API_KEY, undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: true,
        fileDownloads: true,
        attribution: true,
      },
    });
    amplitude.setDeviceId(undefined); // авто
  }
};

// Отправка события
export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  if (AMPLITUDE_API_KEY) {
    amplitude.track(eventName, eventProperties);
  }
};

// Идентификация пользователя
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (AMPLITUDE_API_KEY) {
    amplitude.setUserId(userId);
    if (userProperties) {
      amplitude.identify(new amplitude.Identify().set(userProperties));
    }
  }
};

// Группировка (например, по роли)
export const setUserGroup = (groupType: string, groupName: string) => {
  if (AMPLITUDE_API_KEY) {
    amplitude.setGroup(groupType, groupName);
  }
};