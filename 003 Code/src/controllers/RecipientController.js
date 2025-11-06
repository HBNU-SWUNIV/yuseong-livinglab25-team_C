const Recipient = require('../models/Recipient');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class RecipientController {
  constructor() {
    this.recipientModel = new Recipient();
    
    // CSV 업로드를 위한 multer 설정
    this.upload = multer({
      dest: 'uploads/',
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new Error('CSV 파일만 업로드 가능합니다.'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB 제한
      }
    });
  }

  /**
   * 수신자 목록 조회
   */
  async getRecipients(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        is_active,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        sortBy: sort_by,
        sortOrder: sort_order
      };

      const result = await this.recipientModel.findAll(options);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Get recipients error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '수신자 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 수신자 상세 조회
   */
  async getRecipient(req, res) {
    try {
      const { id } = req.params;
      const recipient = await this.recipientModel.findById(id);

      if (!recipient) {
        return res.status(404).json({
          error: 'Recipient not found',
          message: '수신자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: recipient
      });

    } catch (error) {
      logger.error('Get recipient error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '수신자 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 수신자 등록
   */
  async createRecipient(req, res) {
    try {
      const { name, phone_number, address, birth_date, emergency_contact } = req.body;

      // 필수 필드 검증
      if (!name || !phone_number) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: '이름과 전화번호는 필수 입력 항목입니다.'
        });
      }

      // 전화번호 형식 검증
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(phone_number.replace(/-/g, ''))) {
        return res.status(400).json({
          error: 'Invalid phone number',
          message: '올바른 전화번호 형식이 아닙니다.'
        });
      }

      // 중복 전화번호 확인
      const existingRecipient = await this.recipientModel.findByPhoneNumber(phone_number);
      if (existingRecipient) {
        return res.status(409).json({
          error: 'Phone number already exists',
          message: '이미 등록된 전화번호입니다.'
        });
      }

      const recipientData = {
        name,
        phone_number,
        address,
        birth_date,
        emergency_contact
      };

      const recipient = await this.recipientModel.create(recipientData);

      logger.info('Recipient created:', { 
        recipientId: recipient.id, 
        name: recipient.name,
        createdBy: req.user.username 
      });

      res.status(201).json({
        success: true,
        message: '수신자가 성공적으로 등록되었습니다.',
        data: recipient
      });

    } catch (error) {
      logger.error('Create recipient error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '수신자 등록 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 수신자 정보 수정
   */
  async updateRecipient(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 수신자 존재 확인
      const existingRecipient = await this.recipientModel.findById(id);
      if (!existingRecipient) {
        return res.status(404).json({
          error: 'Recipient not found',
          message: '수신자를 찾을 수 없습니다.'
        });
      }

      // 전화번호 변경 시 중복 확인
      if (updateData.phone_number && updateData.phone_number !== existingRecipient.phone_number) {
        const duplicateRecipient = await this.recipientModel.findByPhoneNumber(updateData.phone_number);
        if (duplicateRecipient) {
          return res.status(409).json({
            error: 'Phone number already exists',
            message: '이미 등록된 전화번호입니다.'
          });
        }
      }

      const updatedRecipient = await this.recipientModel.update(id, updateData);

      logger.info('Recipient updated:', { 
        recipientId: id, 
        updatedBy: req.user.username 
      });

      res.json({
        success: true,
        message: '수신자 정보가 성공적으로 수정되었습니다.',
        data: updatedRecipient
      });

    } catch (error) {
      logger.error('Update recipient error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '수신자 정보 수정 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 수신자 삭제 (비활성화)
   */
  async deleteRecipient(req, res) {
    try {
      const { id } = req.params;

      // 수신자 존재 확인
      const existingRecipient = await this.recipientModel.findById(id);
      if (!existingRecipient) {
        return res.status(404).json({
          error: 'Recipient not found',
          message: '수신자를 찾을 수 없습니다.'
        });
      }

      await this.recipientModel.update(id, { is_active: false });

      logger.info('Recipient deactivated:', { 
        recipientId: id, 
        deactivatedBy: req.user.username 
      });

      res.json({
        success: true,
        message: '수신자가 성공적으로 비활성화되었습니다.'
      });

    } catch (error) {
      logger.error('Delete recipient error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '수신자 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * CSV 파일을 통한 수신자 일괄 등록
   */
  async bulkUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'CSV 파일을 업로드해주세요.'
        });
      }

      const results = [];
      const errors = [];
      let lineNumber = 1;

      // CSV 파일 파싱
      const csvData = await new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            data.push(row);
          })
          .on('end', () => {
            resolve(data);
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      // 각 행 처리
      for (const row of csvData) {
        lineNumber++;
        
        try {
          const { name, phone_number, address, birth_date, emergency_contact } = row;

          // 필수 필드 검증
          if (!name || !phone_number) {
            errors.push({
              line: lineNumber,
              error: '이름과 전화번호는 필수 입력 항목입니다.',
              data: row
            });
            continue;
          }

          // 전화번호 형식 검증
          const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
          if (!phoneRegex.test(phone_number.replace(/-/g, ''))) {
            errors.push({
              line: lineNumber,
              error: '올바른 전화번호 형식이 아닙니다.',
              data: row
            });
            continue;
          }

          // 중복 전화번호 확인
          const existingRecipient = await this.recipientModel.findByPhoneNumber(phone_number);
          if (existingRecipient) {
            errors.push({
              line: lineNumber,
              error: '이미 등록된 전화번호입니다.',
              data: row
            });
            continue;
          }

          // 수신자 생성
          const recipientData = {
            name: name.trim(),
            phone_number: phone_number.trim(),
            address: address ? address.trim() : null,
            birth_date: birth_date || null,
            emergency_contact: emergency_contact ? emergency_contact.trim() : null
          };

          const recipient = await this.recipientModel.create(recipientData);
          results.push(recipient);

        } catch (error) {
          errors.push({
            line: lineNumber,
            error: error.message,
            data: row
          });
        }
      }

      // 임시 파일 삭제
      fs.unlinkSync(req.file.path);

      logger.info('Bulk upload completed:', { 
        totalProcessed: csvData.length,
        successCount: results.length,
        errorCount: errors.length,
        uploadedBy: req.user.username 
      });

      res.json({
        success: true,
        message: `총 ${csvData.length}개 중 ${results.length}개가 성공적으로 등록되었습니다.`,
        data: {
          successCount: results.length,
          errorCount: errors.length,
          errors: errors.slice(0, 10) // 최대 10개 오류만 반환
        }
      });

    } catch (error) {
      // 임시 파일 삭제
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      logger.error('Bulk upload error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'CSV 업로드 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 수신자 검색
   */
  async searchRecipients(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          error: 'Invalid search query',
          message: '검색어는 최소 2자 이상 입력해주세요.'
        });
      }

      const results = await this.recipientModel.search(query.trim(), parseInt(limit));

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('Search recipients error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '수신자 검색 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 수신자 통계 조회
   */
  async getStatistics(req, res) {
    try {
      const stats = await this.recipientModel.getStatistics();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: '통계 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = RecipientController;