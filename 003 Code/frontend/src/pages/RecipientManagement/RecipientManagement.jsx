import React, { useState, useEffect, useMemo } from "react"; // useEffect 추가
import styled from "styled-components";
import axios from "axios"; // axios 추가
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
  // 1. 초기값을 빈 배열로 변경 (더미 데이터 제거)
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  const [selectedIds, setSelectedIds] = useState([]);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 10;

  // 2. 백엔드에서 데이터 가져오기 (GET /api/recipients)
  const fetchRecipients = async () => {
    try {
      setLoading(true);
      // vite.config.js의 proxy 덕분에 http://localhost:3001 생략 가능
      const response = await axios.get("/api/recipients");

      // 백엔드 응답 구조에 따라 데이터 세팅 (보통 response.data.data 또는 response.data)
      // 여기서는 백엔드가 { success: true, data: [...] } 라고 준다고 가정
      const rawData = response.data.data || response.data;

      // 프론트엔드 테이블 형식에 맞게 데이터 가공
      const formattedData = rawData.map((item, index) => ({
        id: item.id,
        no: index + 1, // 번호
        name: item.name,
        // DB 컬럼명에 따라 매칭 (phone_number -> phone)
        phone: item.phone_number || item.phone,
        address: item.address || "-",
        birthDate: item.birth_date || "-", // DB 컬럼명이 birth_date라면
        consent: true, // DB에 동의 여부가 없다면 기본 true
        messageType: "일반 메시지", // DB에 유형이 없다면 기본값
        sendStatus: "pending", // 발송 상태 (필요 시 조인해서 가져와야 함)
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

  // 페이지가 처음 열릴 때 데이터 가져오기
  useEffect(() => {
    fetchRecipients();
  }, []);

  // ... (필터링 로직은 그대로 유지) ...
  const filteredRecipients = useMemo(() => {
    let filtered = [...recipients];

    // 기간 필터 적용
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

    // 검색 필터 적용
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

  // 페이지네이션 적용
  const paginatedRecipients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecipients
      .slice(startIndex, endIndex)
      .map((recipient, index) => ({
        ...recipient,
        no: startIndex + index + 1, // 페이지별 번호 매기기
      }));
  }, [filteredRecipients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecipients.length / itemsPerPage);

  // 통계 계산 (더미 로직 유지하되 실제 데이터 기반으로 작동)
  const stats = useMemo(() => {
    const available = filteredRecipients.length; // 일단 전체 인원
    const optOut = 0; // DB에 수신거부 컬럼이 생기면 수정 필요
    return { available, optOut };
  }, [filteredRecipients]);

  // ... (핸들러 함수들) ...
  const handleSelectAll = (checked) => {
    if (checked) setSelectedIds(paginatedRecipients.map((r) => r.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id, checked) => {
    if (checked) setSelectedIds([...selectedIds, id]);
    else setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  // 3. 수신자 저장 핸들러 (POST /api/recipients) - 핵심 수정 부분!
  const handleSaveRecipient = async (formData) => {
    try {
      // 백엔드로 보낼 데이터 준비
      // 백엔드가 phone_number를 원한다면 키 이름을 맞춰줘야 함
      const payload = {
        name: formData.name,
        phone_number: formData.phone, // 프론트(phone) -> 백엔드(phone_number)
        address: formData.address,
        // birth_date 등 다른 필드도 필요하면 추가
      };

      // API 요청
      await axios.post("/api/recipients", payload);

      // 성공 시 처리
      setToast({
        type: "success",
        title: "수신자 추가 완료",
        message: "수신자가 성공적으로 데이터베이스에 저장되었습니다.",
      });

      // 목록 새로고침 (DB에서 다시 가져오기)
      fetchRecipients();

      // 첫 페이지로 이동
      setCurrentPage(1);
    } catch (error) {
      console.error("수신자 추가 에러:", error);
      setToast({
        type: "error",
        title: "추가 실패",
        message:
          error.response?.data?.error || "수신자 추가 중 오류가 발생했습니다.",
      });
    }
  };

  const handleRefresh = () => {
    setSelectedIds([]);
    setCurrentPage(1);
    fetchRecipients(); // 실제 데이터 새로고침
  };

  const handleFullRefresh = () => {
    window.location.reload();
  };

  const handleCSVUpload = () => {
    // CSV 로직은 추후 구현
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

  // isAllSelected, isIndeterminate 계산
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

      {/* 로딩 중일 때 표시할 UI가 있으면 좋지만 일단 테이블 보여줌 */}
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
