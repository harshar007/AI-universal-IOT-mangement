import deviceTools from './deviceTools.js';
import controlTools from './controlTools.js';
import telemetryTools from './telemetryTools.js';
import alertTools from './alertTools.js';
import systemTools from './systemTools.js';

export const allTools = [
  ...deviceTools,
  ...controlTools,
  ...telemetryTools,
  ...alertTools,
  ...systemTools
];

export default allTools;
