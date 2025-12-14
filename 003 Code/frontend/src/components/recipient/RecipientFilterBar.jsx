import React, { useState } from "react";
import styled from "styled-components";
import {
  Filter,
  Search,
  Upload,
  UserPlus,
  Calendar,
  RefreshCw,
} from "lucide-react";
import DateRangePicker from "../common/DateRangePicker";

const FilterBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 0;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PeriodLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
`;

const PeriodSegmentedControl = styled.div`
  display: inline-flex;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
`;

// [수정 포인트 1] active -> $active 로 변경
const PeriodButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background-color: ${(props) => (props.$active ? "#ffffff" : "transparent")};
  color: ${(props) => (props.$active ? "#2563eb" : "#6b7280")};
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: ${(props) =>
    props.$active ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none"};

  &:hover {
    background-color: ${(props) =>
      props.$active ? "#ffffff" : "rgba(255, 255, 255, 0.5)"};
    color: ${(props) => (props.$active ? "#2563eb" : "#374151")};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SmallRefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    color: #1a1a1a;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s ease;

  &:hover {
    border-color: #d1d5db;
  }

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
  pointer-events: none;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #ffffff;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #1a1a1a;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;

  &:hover {
    background-color: #1d4ed8;
    border-color: #1d4ed8;
  }
`;

const fetchRecipients = async () => {
  try {
    setLoading(true);
    console.log("📡 서버에 수신자 목록 요청 중..."); // [로그 1]

    const response = await axios.get("/api/recipients");
    console.log("📦 서버 응답 도착:", response.data); // [로그 2]

    const rawData = response.data.data || response.data;

    // 데이터가 비어있으면 로그 출력
    if (!rawData || rawData.length === 0) {
      console.warn("⚠️ 데이터가 비어있습니다 (DB에 수신자가 없거나 매핑 실패)");
    }

    const formattedData = rawData.map((item, index) => ({
      id: item.id,
      no: index + 1,
      name: item.name,
      phone: item.phone_number || item.phone, // DB 컬럼명 확인
      address: item.address || "-",
      birthDate: item.birth_date || "-",
      consent: true,
      messageType: "일반 메시지",
      sendStatus: "pending",
      registeredDate: item.created_at
        ? item.created_at.substring(0, 10).replace(/-/g, ".")
        : "-",
    }));

    setRecipients(formattedData);
  } catch (error) {
    console.error("❌ 수신자 목록 불러오기 실패:", error);
    setToast({
      type: "error",
      title: "데이터 로드 실패",
      message: "수신자 목록을 불러오지 못했습니다.",
    });
  } finally {
    setLoading(false);
  }
};

function RecipientFilterBar({
  periodFilter,
  onPeriodChange,
  searchQuery,
  onSearchChange,
  onFilterClick,
  onCSVUpload,
  onAddRecipient,
  onRefresh,
  onFullRefresh,
  customStartDate,
  customEndDate,
  onCustomPeriodConfirm,
}) {
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

  const periodOptions = [
    { value: "all", label: "전체" },
    { value: "1month", label: "1개월" },
    { value: "6months", label: "6개월" },
    { value: "1year", label: "1년" },
    { value: "custom", label: "기간 설정", icon: Calendar },
  ];

  const handlePeriodClick = (value) => {
    if (value === "custom") {
      setIsPeriodModalOpen(true);
    } else {
      onPeriodChange(value);
    }
  };

  const handleCustomPeriodConfirm = (startDate, endDate) => {
    const formatDate = (date) => {
      if (!date) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    onCustomPeriodConfirm(formatDate(startDate), formatDate(endDate));
    onPeriodChange("custom");
    setIsPeriodModalOpen(false);
  };

  return (
    <>
      <FilterBarContainer>
        <FilterGroup>
          <PeriodLabel>수신 기간</PeriodLabel>
          <PeriodSegmentedControl>
            {periodOptions.map((option) => {
              const Icon = option.icon;
              return (
                <PeriodButton
                  key={option.value}
                  // [수정 포인트 2] active -> $active
                  $active={periodFilter === option.value}
                  onClick={() => handlePeriodClick(option.value)}
                >
                  {Icon && <Icon size={16} />}
                  {option.label}
                </PeriodButton>
              );
            })}
          </PeriodSegmentedControl>
          <SmallRefreshButton
            onClick={onRefresh || (() => window.location.reload())}
            title="새로고침"
          >
            <RefreshCw size={18} />
          </SmallRefreshButton>
        </FilterGroup>

        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="이름 또는 전화번호 검색"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </SearchContainer>

        <ActionButton onClick={onCSVUpload}>
          <Upload size={18} />
          CSV 업로드
        </ActionButton>

        <PrimaryButton onClick={onAddRecipient}>
          <UserPlus size={18} />
          수신자 추가
        </PrimaryButton>

        <ActionButton onClick={onFullRefresh}>
          <RefreshCw size={18} />
          전체 새로고침
        </ActionButton>
      </FilterBarContainer>

      {isPeriodModalOpen && (
        <DateRangePicker
          startDate={customStartDate ? new Date(customStartDate) : null}
          endDate={customEndDate ? new Date(customEndDate) : null}
          onChange={handleCustomPeriodConfirm}
          onClose={() => setIsPeriodModalOpen(false)}
        />
      )}
    </>
  );
}

export default RecipientFilterBar;
