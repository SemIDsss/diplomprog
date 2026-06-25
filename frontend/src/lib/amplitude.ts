// frontend/src/lib/amplitude.ts
import * as amplitude from '@amplitude/analytics-browser';

const API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;


const IS_ANALYTICS_ENABLED = process.env.NODE_ENV === 'production' && !!API_KEY;

export const initAmplitude = () => {
  
  if (!IS_ANALYTICS_ENABLED) {
    console.log('🔇 Amplitude отключен (не production или нет ключа)');
    return;
  }

  try {
    amplitude.init(API_KEY, undefined, {
      defaultTracking: true,
    
    });
    console.log(' Amplitude инициализирован');
  } catch (error) {
    
    console.warn(' Ошибка инициализации Amplitude:', error);
  }
};

export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  // Если аналитика выключена — просто выходим
  if (!IS_ANALYTICS_ENABLED) return;

  // Проверяем, есть ли интернет
  if (!navigator.onLine) {
    console.warn('📡 Нет интернета, событие не отправлено:', eventName);
    return;
  }

  try {
    amplitude.track(eventName, eventProperties);
  } catch (error) {
    // Логируем ошибку тихо, чтобы не засорять консоль
    // или можно записать в массив для повторной отправки
    console.debug('📊 Ошибка отправки события Amplitude:', eventName, error);
  }
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (!IS_ANALYTICS_ENABLED || !userId) return;
  try {
    amplitude.setUserId(userId);
    if (userProperties) {
      const identify = new amplitude.Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identify.set(key, value);
      });
      amplitude.identify(identify);
    }
  } catch (error) {
    console.debug('📊 Ошибка идентификации пользователя:', error);
  }
};

export const setUserGroup = (groupType: string, groupName: string) => {
  if (!IS_ANALYTICS_ENABLED) return;
  try {
    amplitude.setGroup(groupType, groupName);
  } catch (error) {
    console.debug('📊 Ошибка установки группы:', error);
  }
};