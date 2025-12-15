import React from "react";
import styled from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
`;

const PageButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f3f4f6;
  }

  /* ★★★ [수정 1] props.active -> props.$active 로 변경 ★★★ */
  ${(props) =>
    props.$active &&
    `
    background-color: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
    font-weight: 600;
    
    &:hover:not(:disabled) {
      background-color: #dbeafe;
      border-color: #2563eb;
    }
  `}
`;

function Pagination({ currentPage, totalPages, onPageChange }) {
  // 페이지 범위 계산 (한 번에 5개씩 보여주기)
  const pageGroupSize = 5;
  const currentGroup = Math.ceil(currentPage / pageGroupSize);
  const startPage = (currentGroup - 1) * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <PaginationContainer>
      <PageButton
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        title="첫 페이지"
      >
        <ChevronsLeft size={16} />
      </PageButton>

      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="이전 페이지"
      >
        <ChevronLeft size={16} />
      </PageButton>

      {pages.map((page) => (
        <PageButton
          key={page}
          /* ★★★ [수정 2] active -> $active 로 변경 (HTML 전달 방지) ★★★ */
          $active={currentPage === page}
          onClick={() => onPageChange(page)}
        >
          {page}
        </PageButton>
      ))}

      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="다음 페이지"
      >
        <ChevronRight size={16} />
      </PageButton>

      <PageButton
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        title="마지막 페이지"
      >
        <ChevronsRight size={16} />
      </PageButton>
    </PaginationContainer>
  );
}

export default Pagination;
