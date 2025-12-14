const express = require("express");
const router = express.Router();
const PublicDataService = require("../services/PublicDataService");

const publicService = new PublicDataService();

// 1) 현재 날씨 조회
router.get("/", async (req, res) => {
  try {
    const data = await publicService.getWeatherData();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 2) 대기질 조회
router.get("/air-quality", async (req, res) => {
  try {
    const data = await publicService.getAirQualityData();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 3) 재난 문자 조회
router.get("/disaster", async (req, res) => {
  try {
    const data = await publicService.getEmergencyAlerts();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
