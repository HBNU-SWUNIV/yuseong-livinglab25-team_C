import React from 'react';

const MessagePreview = ({ data, onClose }) => {
  if (!data) return null;

  // 메시지 타입별 라벨
  const getTypeLabel = (type) => {
    const types = {
      daily: '일일 날씨',
      emergency: '긴급 알림',
      welfare: '복지 알림',
      custom: '일반 메시지'
    };
    return types[type] || type;
  };

  // 발송 시점 표시
  const getScheduleInfo = () => {
    if (data.scheduleType === 'now') {
      return '즉시 발송';
    } else {
      return `${data.scheduledDate} ${data.scheduledTime}에 발송 예정`;
    }
  };

  // 수신자 정보 표시
  const getRecipientInfo = () => {
    const info = {
      all: '전체 수신자',
      active: '활성 수신자만'
    };
    return info[data.recipientType] || data.recipientType;
  };

  // 모달 외부 클릭 시 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="preview-modal" onClick={handleOverlayClick}>
      <div className="preview-content">
        <div className="preview-header">
          <h2>메시지 미리보기</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        {/* 메시지 정보 */}
        <div className="message-info-section">
          <div className="info-grid">
            <div className="info-item">
              <strong>메시지 타입:</strong> {getTypeLabel(data.type)}
            </div>
            <div className="info-item">
              <strong>제목:</strong> {data.title}
            </div>
            <div className="info-item">
              <strong>발송 시점:</strong> {getScheduleInfo()}
            </div>
            <div className="info-item">
              <strong>수신자:</strong> {getRecipientInfo()}
            </div>
            <div className="info-item">
              <strong>문자 수:</strong> {data.content.length}/90자
            </div>
          </div>
        </div>

        {/* 휴대폰 목업 */}
        <div className="phone-mockup">
          <div className="phone-screen">
            <div className="message-header">
              <div className="sender-info">
                <strong>유성구청</strong>
                <span className="time">
                  {new Date().toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            
            <div className="message-bubble">
              {data.content}
            </div>
            
            <div className="message-footer">
              <small>SMS 메시지</small>
            </div>
          </div>
        </div>

        {/* 메시지 분석 */}
        <div className="message-analysis">
          <h3>메시지 분석</h3>
          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-label">문자 길이</div>
              <div className={`analysis-value ${data.content.length > 90 ? 'error' : data.content.length > 80 ? 'warning' : 'success'}`}>
                {data.content.length}/90자
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">피처폰 호환성</div>
              <div className={`analysis-value ${data.content.length <= 90 ? 'success' : 'error'}`}>
                {data.content.length <= 90 ? '호환됨' : '호환 안됨'}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">예상 발송 비용</div>
              <div className="analysis-value">
                {Math.ceil(data.content.length / 90)} SMS
              </div>
            </div>
          </div>
        </div>

        {/* 주의사항 */}
        {data.content.length > 90 && (
          <div className="warning-section">
            <h4>⚠️ 주의사항</h4>
            <ul>
              <li>메시지가 90자를 초과하여 피처폰에서 잘릴 수 있습니다.</li>
              <li>긴 메시지는 여러 개의 SMS로 분할되어 발송됩니다.</li>
              <li>메시지를 90자 이하로 줄이는 것을 권장합니다.</li>
            </ul>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="preview-actions">
          <button onClick={onClose} className="btn btn-secondary">
            수정하기
          </button>
          <button 
            onClick={() => {
              // 부모 컴포넌트의 발송 함수 호출
              onClose();
            }} 
            className="btn btn-primary"
          >
            이대로 발송
          </button>
        </div>
      </div>

      <style jsx>{`
        .message-info-section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .info-item {
          font-size: 14px;
        }

        .info-item strong {
          color: #495057;
        }

        .phone-mockup {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 25px;
          padding: 20px;
          margin: 20px 0;
          display: flex;
          justify-content: center;
        }

        .phone-screen {
          background: white;
          border-radius: 15px;
          padding: 20px;
          width: 280px;
          min-height: 200px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }

        .sender-info {
          display: flex;
          flex-direction: column;
        }

        .time {
          font-size: 12px;
          color: #6c757d;
        }

        .message-bubble {
          background: #007bff;
          color: white;
          padding: 12px 16px;
          border-radius: 18px;
          margin-bottom: 10px;
          max-width: 85%;
          word-wrap: break-word;
          line-height: 1.4;
        }

        .message-footer {
          text-align: right;
          margin-top: 10px;
        }

        .message-footer small {
          color: #6c757d;
          font-size: 11px;
        }

        .message-analysis {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
        }

        .message-analysis h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #333;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .analysis-item {
          text-align: center;
        }

        .analysis-label {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 5px;
        }

        .analysis-value {
          font-weight: bold;
          font-size: 14px;
        }

        .analysis-value.success {
          color: #28a745;
        }

        .analysis-value.warning {
          color: #ffc107;
        }

        .analysis-value.error {
          color: #dc3545;
        }

        .warning-section {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .warning-section h4 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .warning-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .warning-section li {
          color: #856404;
          margin-bottom: 5px;
        }

        .preview-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }

        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }

          .phone-screen {
            width: 100%;
          }

          .preview-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default MessagePreview;