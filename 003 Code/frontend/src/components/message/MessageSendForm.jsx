import React, { useState } from 'react';
import styled from 'styled-components';
import ReceiverSelect from './ReceiverSelect';
import MessageTypeToggle from './MessageTypeToggle';
import SendMethodRadio from './SendMethodRadio';
import MessageEditor from './MessageEditor';
import MessageActionButtons from './MessageActionButtons';

const FormContainer = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

function MessageSendForm() {
  const [formData, setFormData] = useState({
    receiver: 'all',
    messageType: '일반 메시지',
    sendMethod: 'immediate',
    scheduledDateTime: '',
    title: '유성구청 민원실 운영시간 변경 안내',
    content: '안녕하세요.\n유성구청 민원실 운영시간이\n12월 15일부터 변경되오니\n시민 여러분의 많은 양해 바랍니다.',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = () => {
    return (
      formData.receiver &&
      formData.messageType &&
      formData.sendMethod &&
      formData.title.trim() !== '' &&
      formData.content.trim() !== '' &&
      formData.content.length <= 90 &&
      (formData.sendMethod === 'immediate' || formData.scheduledDateTime !== '')
    );
  };

  const handleReset = () => {
    setFormData({
      receiver: 'all',
      messageType: '일반 메시지',
      sendMethod: 'immediate',
      scheduledDateTime: '',
      title: '',
      content: '',
    });
  };

  const handlePreview = () => {
    console.log('미리보기:', formData);
    // TODO: 미리보기 모달 구현
    alert('미리보기 기능은 구현 예정입니다.');
  };

  const handleSend = () => {
    if (!isFormValid()) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }
    console.log('발송:', formData);
    // TODO: 실제 발송 API 호출
    alert('메시지가 발송되었습니다.');
    handleReset();
  };

  return (
    <FormContainer>
      <FormSection>
        <ReceiverSelect
          value={formData.receiver}
          onChange={(value) => handleChange('receiver', value)}
        />
        
        <MessageTypeToggle
          value={formData.messageType}
          onChange={(value) => handleChange('messageType', value)}
        />
        
        <SendMethodRadio
          value={formData.sendMethod}
          onChange={(value) => handleChange('sendMethod', value)}
          scheduledDateTime={formData.scheduledDateTime}
          onScheduledDateTimeChange={(value) => handleChange('scheduledDateTime', value)}
        />
        
        <MessageEditor
          title={formData.title}
          content={formData.content}
          onTitleChange={(value) => handleChange('title', value)}
          onContentChange={(value) => handleChange('content', value)}
        />
        
        <MessageActionButtons
          onReset={handleReset}
          onPreview={handlePreview}
          onSend={handleSend}
          isSendDisabled={!isFormValid()}
        />
      </FormSection>
    </FormContainer>
  );
}

export default MessageSendForm;
