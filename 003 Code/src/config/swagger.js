// src/config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "유성안심문자 서비스 API",
      version: "1.0.0",
      description:
        "유성구청 안심문자 서비스(Node.js Express) API 명세서입니다.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "로컬 개발 서버",
      },
    ],
  },
  // api 문서를 읽어올 파일 경로 (routes 폴더 안의 모든 .js 파일)
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
