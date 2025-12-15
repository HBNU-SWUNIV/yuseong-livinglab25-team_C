import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import axios from "axios";
import RecipientHeader from "../../components/recipient/RecipientHeader";
import RecipientFilterBar from "../../components/recipient/RecipientFilterBar";
import RecipientTable from "../../components/recipient/RecipientTable";
import Pagination from "../../components/common/Pagination";
import AddRecipientModal from "../../components/recipient/AddRecipientModal";
import Toast from "../../components/common/Toast";

const PageContainer = styled.div`
  padding: 32px;
  padding-top: 32px;
  min-width: 0;
`;

function RecipientManagement() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState([]);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 10;

  // 백엔드에서 데이터 가져오기
  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/recipients");
      const rawData = response.data.data || response.data;

      // 프론트엔드 테이블 형식에 맞게 데이터 가공
      const formattedData = rawData.map((item, index) => ({
        id: item.id,
        no: index + 1,
        name: item.name,
        phone: item.phone_number || item.phone, // DB: phone_number -> UI: phone
        address: item.address || "-",
        birthDate: item.birth_date
          ? String(item.birth_date).substring(0, 10) // "2025-12-15" 까지만 나옴
          : "-", // DB: birth_date -> UI: birthDate
        consent: true,
        messageType: "일반 메시지",
        sendStatus: "pending",
        registeredDate: item.created_at
          ? item.created_at.substring(0, 10).replace(/-/g, ".")
          : "-",
      }));

      setRecipients(formattedData);
    } catch (error) {
      console.error("수신자 목록 불러오기 실패:", error);
      setToast({
        type: "error",
        title: "데이터 로드 실패",
        message: "수신자 목록을 불러오지 못했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  // 필터링 로직
  const filteredRecipients = useMemo(() => {
    let filtered = [...recipients];

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
            filtered = filtered.filter((recipient) => {
              const rDate = new Date(
                recipient.registeredDate.replace(/\./g, "-")
              );
              return rDate >= startDate && rDate <= endDate;
            });
          }
          break;
        default:
          break;
      }
      if (periodFilter !== "custom") {
        filtered = filtered.filter((recipient) => {
          const rDate = new Date(recipient.registeredDate.replace(/\./g, "-"));
          return rDate >= filterDate;
        });
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (recipient) =>
          recipient.name.toLowerCase().includes(query) ||
          (recipient.phone &&
            recipient.phone.replace(/-/g, "").includes(query.replace(/-/g, "")))
      );
    }
    return filtered;
  }, [recipients, periodFilter, searchQuery, customStartDate, customEndDate]);

  // 페이지네이션
  const paginatedRecipients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecipients
      .slice(startIndex, endIndex)
      .map((recipient, index) => ({
        ...recipient,
        no: startIndex + index + 1,
      }));
  }, [filteredRecipients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecipients.length / itemsPerPage);

  const stats = useMemo(() => {
    const available = filteredRecipients.length;
    const optOut = 0;
    return { available, optOut };
  }, [filteredRecipients]);

  const handleSelectAll = (checked) => {
    if (checked) setSelectedIds(paginatedRecipients.map((r) => r.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id, checked) => {
    if (checked) setSelectedIds([...selectedIds, id]);
    else setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  // ★★★ [수정된 핵심 부분] 수신자 저장 핸들러 ★★★
  const handleSaveRecipient = async (recipientData) => {
    try {
      // 모달(AddRecipientModal)에서 이미 { name, phone_number, birth_date, ... }
      // 형태로 완벽하게 만들어서 넘겨주므로, 그대로 전송하면 됩니다.
      console.log("🔥 [전송 데이터 확인]", recipientData);

      await axios.post("/api/recipients", recipientData);

      setToast({
        type: "success",
        title: "수신자 추가 완료",
        message: "수신자가 성공적으로 데이터베이스에 저장되었습니다.",
      });

      fetchRecipients();
      setCurrentPage(1);
    } catch (error) {
      console.error("수신자 추가 에러:", error);
      const errorMsg =
        error.response?.data?.message || "수신자 추가 중 오류가 발생했습니다.";

      setToast({
        type: "error",
        title: "추가 실패",
        message: errorMsg,
      });
    }
  };

  const handleRefresh = () => {
    setSelectedIds([]);
    setCurrentPage(1);
    fetchRecipients();
  };

  const handleFullRefresh = () => {
    window.location.reload();
  };

  const handleCSVUpload = () => {
    console.log("CSV Upload Clicked");
  };

  const handleAddRecipient = () => {
    setIsAddModalOpen(true);
  };

  const handleCustomPeriodConfirm = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setCurrentPage(1);
  };

  React.useEffect(() => {
    setSelectedIds([]);
  }, [currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, customStartDate, customEndDate]);

  const existingPhones = useMemo(
    () => recipients.map((r) => r.phone),
    [recipients]
  );

  const isAllSelected =
    paginatedRecipients.length > 0 &&
    paginatedRecipients.every((r) => selectedIds.includes(r.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  return (
    <PageContainer>
      <RecipientHeader
        totalCount={filteredRecipients.length}
        selectedCount={selectedIds.length}
        availableCount={stats.available}
        optOutCount={stats.optOut}
      />

      <RecipientFilterBar
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={() => console.log("필터 클릭")}
        onCSVUpload={handleCSVUpload}
        onAddRecipient={handleAddRecipient}
        onRefresh={handleRefresh}
        onFullRefresh={handleFullRefresh}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomPeriodConfirm={handleCustomPeriodConfirm}
      />

      <RecipientTable
        recipients={paginatedRecipients}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        totalCount={filteredRecipients.length}
        selectedCount={selectedIds.length}
        onRefresh={handleFullRefresh}
      />

      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <AddRecipientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveRecipient}
        existingPhones={existingPhones}
      />

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </PageContainer>
  );
}

export default RecipientManagement;
