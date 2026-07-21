const mqtt = require('mqtt');
const config = require('../config/gatewayConfig');
const logger = require('../utils/logger');

// Subscribers
const telemetrySubscriber = require('../subscribers/telemetrySubscriber');
const statusSubscriber = require('../subscribers/statusSubscriber');
const heartbeatSubscriber = require('../subscribers/heartbeatSubscriber');
const logSubscriber = require('../subscribers/logSubscriber');

// Publishers
const commandPublisher = require('../publishers/commandPublisher');
const otaPublisher = require('../publishers/otaPublisher');

let client = null;

const connectMqttClient = () => {
  logger.info(`Connecting internal gateway MQTT client to ${config.mqttBrokerUrl}...`);
  
  client = mqtt.connect(config.mqttBrokerUrl, {
    clientId: 'gateway-internal-client',
    clean: true
  });

  client.on('connect', () => {
    logger.info('Internal gateway MQTT client connected successfully.');
    
    // Subscribe to all relevant device topics using single wildcards
    const topics = [
      'iot/device/+/telemetry',
      'iot/device/+/status',
      'iot/device/+/heartbeat',
      'iot/device/+/logs',
      'iot/device/+/response'
    ];
    
    client.subscribe(topics, { qos: 1 }, (err) => {
      if (err) {
        logger.error('Failed to subscribe to MQTT topics: ' + err.message);
      } else {
        logger.info('Subscribed to all device MQTT topics.');
      }
    });

    // Initialize publishers with this active client connection
    commandPublisher.init(client);
    otaPublisher.init(client);
  });

  client.on('message', (topic, message) => {
    // Parse deviceId from topic: iot/device/{deviceId}/{type}
    const topicParts = topic.split('/');
    if (topicParts.length < 4) return;
    
    const deviceId = topicParts[2];
    const messageType = topicParts[3];
    
    logger.debug(`MQTT Message Received: topic=${topic}, message=${message.toString()}`);
    
    switch (messageType) {
      case 'telemetry':
        telemetrySubscriber.handle(deviceId, message);
        break;
      case 'status':
        statusSubscriber.handle(deviceId, message);
        break;
      case 'heartbeat':
        heartbeatSubscriber.handle(deviceId, message);
        break;
      case 'logs':
        logSubscriber.handle(deviceId, message);
        break;
      case 'response':
        logger.info(`Device ${deviceId} responded to command: ${message.toString()}`);
        break;
      default:
        logger.warn(`Unhandled message type ${messageType} on topic ${topic}`);
    }
  });

  client.on('error', (err) => {
    logger.error('Internal MQTT client error: ' + err.message);
  });

  client.on('close', () => {
    logger.warn('Internal MQTT client disconnected.');
  });
};

const getClient = () => client;

module.exports = {
  connectMqttClient,
  getClient
};
