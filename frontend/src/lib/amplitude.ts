import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '';

// Проверка, что ключ задан
const isAmplitudeEnabled = () => {
  if (!AMPLITUDE_API_KEY) {
    console.warn('⚠️ Amplitude API key не задан. События не будут отправляться.');
    return false;
  }
  return true;
};

// Инициализация Amplitude
export const initAmplitude = () => {
  if (!isAmplitudeEnabled()) return;

  try {
    amplitude.init(AMPLITUDE_API_KEY, undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: true,
        fileDownloads: true,
        attribution: true,
      },
    });
    // ✅ Убираем setDeviceId(undefined) — это не обязательно
    console.log('✅ Amplitude инициализирован');
  } catch (error) {
    console.error('❌ Ошибка инициализации Amplitude:', error);
  }
};

// Отправка события
export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  if (!isAmplitudeEnabled()) return;

  try {
    amplitude.track(eventName, eventProperties);
    console.log(`📊 Amplitude: ${eventName}`, eventProperties || '');
  } catch (error) {
    console.error(`❌ Ошибка отправки события ${eventName}:`, error);
  }
};

// Идентификация пользователя (после логина/регистрации)
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (!isAmplitudeEnabled()) return;

  try {
    amplitude.setUserId(userId);
    if (userProperties) {
      const identifyObj = new amplitude.Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identifyObj.set(key, value);
      });
      amplitude.identify(identifyObj);
    }
    console.log(`👤 Amplitude: идентифицирован пользователь ${userId}`, userProperties || '');
  } catch (error) {
    console.error('❌ Ошибка идентификации пользователя:', error);
  }
};

// Установка группы пользователя (например, по роли)
export const setUserGroup = (groupType: string, groupName: string) => {
  if (!isAmplitudeEnabled()) return;

  try {
    amplitude.setGroup(groupType, groupName);
    console.log(`📂 Amplitude: группа ${groupType} = ${groupName}`);
  } catch (error) {
    console.error('❌ Ошибка установки группы:', error);
  }
};

// Сброс пользователя (при выходе из аккаунта)
export const resetUser = () => {
  if (!isAmplitudeEnabled()) return;

  try {
    amplitude.reset();
    console.log('👋 Amplitude: пользователь сброшен');
  } catch (error) {
    console.error('❌ Ошибка сброса пользователя:', error);
  }
};

// Обновление свойств пользователя (например, после изменения профиля)
export const updateUserProperties = (properties: Record<string, any>) => {
  if (!isAmplitudeEnabled()) return;

  try {
    const identifyObj = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identifyObj.set(key, value);
    });
    amplitude.identify(identifyObj);
    console.log('🔄 Amplitude: свойства пользователя обновлены', properties);
  } catch (error) {
    console.error('❌ Ошибка обновления свойств:', error);
  }
};