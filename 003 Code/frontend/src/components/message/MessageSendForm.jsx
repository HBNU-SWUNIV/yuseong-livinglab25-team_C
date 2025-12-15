import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";
import ReceiverSelect from "./ReceiverSelect";
import MessageTypeToggle from "./MessageTypeToggle";
import SendMethodRadio from "./SendMethodRadio";
import MessageEditor from "./MessageEditor";
import MessageActionButtons from "./MessageActionButtons";

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

// ★★★ [수정 포인트] '긴급 메시지' 추가 완료 ★★★
const MESSAGE_TYPE_MAP = {
  // 화면에서 보내주는 한글 이름들
  "일반 메시지": "custom",
  "긴급 메시지": "emergency", // [추가됨] 범인은 바로 이 녀석!
  "긴급 알림": "emergency", // 혹시 몰라 이것도 유지
  "일일 날씨": "daily",
  "복지 알림": "welfare",
  "맞춤 알림": "custom",

  // 영어 이름들
  General: "custom",
  Emergency: "emergency",
  Weather: "daily",
  Welfare: "welfare",
};

function MessageSendForm() {
  const [formData, setFormData] = useState({
    receiver: "all",
    messageType: "일반 메시지",
    sendMethod: "immediate",
    scheduledDateTime: "",
    title: "긴급 상황 전파",
    content: "긴급 메시지 테스트입니다.",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    // 값이 바뀔 때마다 로그를 찍어서 확인
    if (field === "messageType") {
      console.log(`[Form] 선택된 타입: "${value}"`);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.receiver &&
      formData.messageType &&
      formData.sendMethod &&
      formData.title.trim() !== "" &&
      formData.content.trim() !== "" &&
      formData.content.length <= 90 &&
      (formData.sendMethod === "immediate" || formData.scheduledDateTime !== "")
    );
  };

  const handleReset = () => {
    setFormData({
      receiver: "all",
      messageType: "일반 메시지",
      sendMethod: "immediate",
      scheduledDateTime: "",
      title: "",
      content: "",
    });
  };

  const handlePreview = () => {
    alert("미리보기 기능은 준비 중입니다.");
  };

  const handleSend = async () => {
    if (!isFormValid()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!window.confirm(`[${formData.messageType}] 발송하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. 타입 변환 (이제 '긴급 메시지'도 'emergency'로 잘 바뀝니다)
      let finalType = MESSAGE_TYPE_MAP[formData.messageType];

      if (!finalType) {
        console.warn(
          `⚠️ 알 수 없는 타입 "${formData.messageType}". 'custom'으로 전송합니다.`
        );
        finalType = "custom";
      }

      console.log(`🚀 전송 시도: "${formData.messageType}" -> "${finalType}"`);

      const payload = {
        type: finalType,
        title: formData.title,
        content: formData.content,
        recipient_ids: formData.receiver === "all" ? [] : [],
        scheduled_at:
          formData.sendMethod === "scheduled"
            ? formData.scheduledDateTime
            : null,
      };

      const endpoint =
        formData.sendMethod === "immediate"
          ? "/api/messages/send"
          : "/api/messages/schedule";

      const response = await axios.post(endpoint, payload);

      console.log("✅ 발송 성공:", response.data);
      alert(response.data.message || "성공적으로 발송되었습니다.");
      handleReset();
    } catch (error) {
      console.error("❌ 발송 실패:", error);
      alert("발송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <FormSection>
        <ReceiverSelect
          value={formData.receiver}
          onChange={(value) => handleChange("receiver", value)}
        />
        <MessageTypeToggle
          value={formData.messageType}
          onChange={(value) => handleChange("messageType", value)}
        />
        <SendMethodRadio
          value={formData.sendMethod}
          onChange={(value) => handleChange("sendMethod", value)}
          scheduledDateTime={formData.scheduledDateTime}
          onScheduledDateTimeChange={(value) =>
            handleChange("scheduledDateTime", value)
          }
        />
        <MessageEditor
          title={formData.title}
          content={formData.content}
          onTitleChange={(value) => handleChange("title", value)}
          onContentChange={(value) => handleChange("content", value)}
        />
        <MessageActionButtons
          onReset={handleReset}
          onPreview={handlePreview}
          onSend={handleSend}
          isSendDisabled={!isFormValid() || isLoading}
        />
      </FormSection>
    </FormContainer>
  );
}

export default MessageSendForm;
