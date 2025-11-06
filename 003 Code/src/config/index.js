module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'yuseong_care_sms'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  sms: {
    provider: process.env.SMS_PROVIDER || 'naver',
    naver: {
      accessKey: process.env.NAVER_SMS_ACCESS_KEY,
      secretKey: process.env.NAVER_SMS_SECRET_KEY,
      serviceId: process.env.NAVER_SMS_SERVICE_ID,
      fromNumber: process.env.NAVER_SMS_FROM_NUMBER
    }
  },
  
  apis: {
    weather: {
      key: process.env.WEATHER_API_KEY,
      url: process.env.WEATHER_API_URL || 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'
    },
    airQuality: {
      key: process.env.AIR_QUALITY_API_KEY,
      url: process.env.AIR_QUALITY_API_URL || 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc'
    },
    disaster: {
      key: process.env.DISASTER_API_KEY,
      url: process.env.DISASTER_API_URL || 'http://apis.data.go.kr/1741000/DisasterMsg3'
    }
  },
  
  scheduler: {
    dailyWeatherTime: process.env.DAILY_WEATHER_TIME || '07:00',
    weatherFetchInterval: parseInt(process.env.WEATHER_FETCH_INTERVAL) || 60,
    airQualityFetchInterval: parseInt(process.env.AIR_QUALITY_FETCH_INTERVAL) || 120
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log'
  }
};