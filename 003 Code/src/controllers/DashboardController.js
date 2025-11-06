const { pool } = require('../config/database');
const logger = require('../utils/logger');

class DashboardController {
  // 대시보드 통계 조회
  static async getStats(req, res) {
    try {
      const connection = await pool.getConnection();
      
      try {
        // 총 수신자 수
        const [recipientCount] = await connection.execute(
          'SELECT COUNT(*) as count FROM recipients WHERE is_active = 1'
        );

        // 오늘 발송된 메시지 수
        const [todayMessages] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM messages 
          WHERE DATE(created_at) = CURDATE() 
          AND status = 'sent'
        `);

        // 오늘 발송 성공률 계산
        const [todayStats] = await connection.execute(`
          SELECT 
            COUNT(*) as total_messages,
            SUM(success_count) as total_success,
            SUM(recipient_count) as total_recipients
          FROM messages 
          WHERE DATE(created_at) = CURDATE()
        `);

        let successRate = 0;
        if (todayStats[0].total_recipients > 0) {
          successRate = Math.round(
            (todayStats[0].total_success / todayStats[0].total_recipients) * 100
          );
        }

        const stats = {
          totalRecipients: recipientCount[0].count,
          todayMessages: todayMessages[0].count,
          successRate: successRate,
          lastUpdated: new Date().toISOString()
        };

        res.json(stats);
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('대시보드 통계 조회 실패:', error);
      res.status(500).json({
        error: '통계 데이터를 불러오는 중 오류가 발생했습니다.',
        message: error.message
      });
    }
  }

  // 최근 메시지 이력 조회
  static async getRecentMessages(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const connection = await pool.getConnection();
      
      try {
        const [messages] = await connection.execute(`
          SELECT 
            id,
            type,
            title,
            recipient_count,
            success_count,
            status,
            sent_at,
            created_at
          FROM messages 
          WHERE status IN ('sent', 'failed')
          ORDER BY created_at DESC 
          LIMIT ?
        `, [limit]);

        res.json({
          messages: messages.map(msg => ({
            ...msg,
            sent_at: msg.sent_at || msg.created_at
          }))
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('최근 메시지 조회 실패:', error);
      res.status(500).json({
        error: '메시지 이력을 불러오는 중 오류가 발생했습니다.',
        message: error.message
      });
    }
  }

  // 시스템 상태 조회
  static async getSystemStatus(req, res) {
    try {
      const connection = await pool.getConnection();
      
      try {
        // 최근 1시간 내 실패한 메시지 확인
        const [recentFailures] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM messages 
          WHERE status = 'failed' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        `);

        // 최근 API 데이터 업데이트 확인
        const [lastApiUpdate] = await connection.execute(`
          SELECT MAX(updated_at) as last_update 
          FROM public_data_cache
        `);

        const alerts = [];
        let systemStatus = 'healthy';

        // 실패한 메시지가 많은 경우
        if (recentFailures[0].count > 10) {
          alerts.push({
            level: 'error',
            title: '메시지 발송 실패 증가',
            message: `최근 1시간 동안 ${recentFailures[0].count}건의 메시지 발송이 실패했습니다.`,
            timestamp: new Date().toISOString()
          });
          systemStatus = 'error';
        } else if (recentFailures[0].count > 5) {
          alerts.push({
            level: 'warning',
            title: '메시지 발송 실패 주의',
            message: `최근 1시간 동안 ${recentFailures[0].count}건의 메시지 발송이 실패했습니다.`,
            timestamp: new Date().toISOString()
          });
          if (systemStatus === 'healthy') systemStatus = 'warning';
        }

        // API 데이터 업데이트 확인
        const lastUpdate = lastApiUpdate[0].last_update;
        if (lastUpdate) {
          const timeDiff = Date.now() - new Date(lastUpdate).getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff > 3) {
            alerts.push({
              level: 'warning',
              title: '공공 데이터 업데이트 지연',
              message: '공공 데이터가 3시간 이상 업데이트되지 않았습니다.',
              timestamp: new Date().toISOString()
            });
            if (systemStatus === 'healthy') systemStatus = 'warning';
          }
        }

        // 정상 상태일 때 기본 알림
        if (alerts.length === 0) {
          alerts.push({
            level: 'info',
            title: '시스템 정상 운영',
            message: '모든 시스템이 정상적으로 작동하고 있습니다.',
            timestamp: new Date().toISOString()
          });
        }

        res.json({
          status: systemStatus,
          alerts: alerts,
          lastChecked: new Date().toISOString()
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('시스템 상태 조회 실패:', error);
      res.status(500).json({
        status: 'error',
        alerts: [{
          level: 'error',
          title: '시스템 상태 확인 실패',
          message: '시스템 상태를 확인하는 중 오류가 발생했습니다.',
          timestamp: new Date().toISOString()
        }],
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;