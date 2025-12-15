import React, { useState, useMemo, useEffect, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import MessageTabs from "../../components/message/MessageTabs";
import MessageFilterBar from "../../components/message/MessageFilterBar";
import MessageHistoryTable from "../../components/message/MessageHistoryTable";
import MessageSendForm from "../../components/message/MessageSendForm";
import Pagination from "../../components/common/Pagination";

const PageContainer = styled.div`
  padding: 32px;
  padding-top: 32px;
  min-width: 0;
`;

const TabContent = styled.div`
  margin-top: 0;
  padding-top: 0;
`;

const TYPE_MAP = {
  daily: "일일 날씨",
  DAILY: "일일 날씨",
  emergency: "긴급 알림",
  EMERGENCY: "긴급 알림",
  welfare: "복지 알림",
  WELFARE: "복지 알림",
  custom: "일반 메시지",
  CUSTOM: "일반 메시지",
  general: "일반 메시지",
};

const STATUS_MAP = {
  pending: "대기중",
  sending: "발송중",
  sent: "발송 완료",
  failed: "발송 실패",
  cancelled: "취소됨",
};

function MessageManagement() {
  const [activeTab, setActiveTab] = useState("history");
  const [messages, setMessages] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageType, setMessageType] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/messages", {
        params: { limit: 100 },
      });

      if (response.data.success) {
        const formattedData = response.data.data.map((msg, index) => {
          const count = msg.recipient_count || 0;
          const recipientDisplay =
            count > 1 ? `전체 (${count}명)` : `개별 (${count}명)`;

          return {
            id: msg.id,
            // 매핑 실패 시 원본 타입 그대로 표시
            messageType: TYPE_MAP[msg.type] || msg.type,
            status: STATUS_MAP[msg.status] || msg.status,
            title: msg.title,
            sendMethod: msg.scheduled_at ? "예약 발송" : "즉시 발송",
            recipientCount: recipientDisplay,
            startDate: msg.created_at
              ? new Date(msg.created_at).toLocaleDateString("ko-KR")
              : "-",
            endDate: msg.sent_at
              ? new Date(msg.sent_at).toLocaleDateString("ko-KR")
              : msg.scheduled_at
              ? new Date(msg.scheduled_at).toLocaleDateString("ko-KR")
              : "-",
            registeredDate: msg.created_at,
          };
        });
        setMessages(formattedData);
      }
    } catch (error) {
      console.error("메시지 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchMessages();
    }
  }, [activeTab, fetchMessages]);

  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    if (messageType !== "all") {
      const targetLabel = TYPE_MAP[messageType] || messageType;
      const dropdownMap = {
        DAILY_WEATHER: "일일 날씨",
        EMERGENCY: "긴급 알림",
        WELFARE: "복지 알림",
        CUSTOM: "일반 메시지",
      };
      const searchLabel = dropdownMap[messageType] || targetLabel;

      filtered = filtered.filter((msg) => msg.messageType === searchLabel);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((msg) =>
        msg.title.toLowerCase().includes(query)
      );
    }

    if (periodFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();
      switch (periodFilter) {
        case "1month":
          filterDate.setMonth(today.getMonth() - 1);
          break;
        case "6months":
          filterDate.setMonth(today.getMonth() - 6);
          break;
        case "1year":
          filterDate.setFullYear(today.getFullYear() - 1);
          break;
        case "custom":
          if (customStartDate && customEndDate) {
            const startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter((msg) => {
              const regDate = new Date(msg.registeredDate);
              return regDate >= startDate && regDate <= endDate;
            });
          }
          break;
        default:
          break;
      }
      if (periodFilter !== "custom") {
        filtered = filtered.filter(
          (msg) => new Date(msg.registeredDate) >= filterDate
        );
      }
    }
    return filtered;
  }, [
    messages,
    messageType,
    searchQuery,
    periodFilter,
    customStartDate,
    customEndDate,
  ]);

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // ★★★ [수정됨] .reverse() 삭제! 백엔드가 준 순서(최신순) 그대로 사용 ★★★
    return filteredMessages
      .slice(startIndex, endIndex)
      .map((message, index) => ({
        ...message,
        // 번호 계산 로직 (전체 개수 - (현재페이지앞개수 + 인덱스))
        no: filteredMessages.length - (startIndex + index),
      }));
  }, [filteredMessages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(paginatedMessages.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const isAllSelected =
    paginatedMessages.length > 0 &&
    paginatedMessages.every((m) => selectedIds.includes(m.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSearch = () => setCurrentPage(1);

  const handleReset = () => {
    setSearchQuery("");
    setMessageType("all");
    setPeriodFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedIds([]);
    setCurrentPage(1);
    fetchMessages();
  };

  const handleCustomPeriodConfirm = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSelectedIds([]);
    fetchMessages();
  };

  const handleFullRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    setSelectedIds([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, customStartDate, customEndDate, messageType, searchQuery]);

  return (
    <PageContainer>
      <MessageTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "history" && (
        <TabContent>
          <MessageFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onReset={handleReset}
            onFullRefresh={handleFullRefresh}
            messageType={messageType}
            onMessageTypeChange={setMessageType}
            periodFilter={periodFilter}
            onPeriodChange={setPeriodFilter}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomPeriodConfirm={handleCustomPeriodConfirm}
          />

          <MessageHistoryTable
            messages={paginatedMessages}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            totalCount={filteredMessages.length}
            selectedCount={selectedIds.length}
            onRefresh={handleRefresh}
          />

          {totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </TabContent>
      )}

      {activeTab === "send" && (
        <TabContent>
          <MessageSendForm />
        </TabContent>
      )}
    </PageContainer>
  );
}

export default MessageManagement;
