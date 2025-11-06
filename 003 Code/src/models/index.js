/**
 * 모델 인덱스 파일
 * Models index file - exports all data models
 */

const BaseModel = require('./BaseModel');
const Recipient = require('./Recipient');
const Message = require('./Message');
const MessageLog = require('./MessageLog');
const CustomReminder = require('./CustomReminder');
const PublicDataCache = require('./PublicDataCache');

// 모델 인스턴스 생성
const models = {
  BaseModel,
  Recipient: new Recipient(),
  Message: new Message(),
  MessageLog: new MessageLog(),
  CustomReminder: new CustomReminder(),
  PublicDataCache: new PublicDataCache()
};

module.exports = models;