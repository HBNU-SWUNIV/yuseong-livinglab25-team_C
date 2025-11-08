const express = require("express");
const router = express.Router();
const WeatherApiClient = require("../services/WeatherApiClient");
const logger = require("../utils/logger");

const weatherClient = new WeatherApiClient();

router.get("/", async (req, res) => {
  try {
    const weather = await weatherClient.getCurrentWeather();
    res.json({
      success: true,
      data: weather
    });
  } catch (err) {
    logger.error("🌧 Weather API Error", { error: err.message });
    res.status(500).json({
      success: false,
      error: err.message || "기상청 API 호출 실패"
    });
  }
});

module.exports = router;
