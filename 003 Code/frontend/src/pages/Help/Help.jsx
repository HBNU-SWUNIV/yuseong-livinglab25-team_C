import React, { useState } from 'react';
import styled from 'styled-components';
import { BookOpen, Download, Eye, ChevronDown, ChevronUp, Search, Send, CheckCircle } from 'lucide-react';
import Toast from '../../components/common/Toast';

const PageContainer = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 24px 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 20px;
    height: 20px;
    color: #2563eb;
  }
`;

const GuideList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GuideItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const GuideInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const GuideIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: #2563eb;
  }
`;

const GuideTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const SearchBox = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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

const Accordion = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
`;

const AccordionHeader = styled.div`
  padding: 16px;
  background-color: ${props => props.isOpen ? '#f9fafb' : '#ffffff'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const AccordionTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
`;

const AccordionContent = styled.div`
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background-color: #ffffff;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background-color: #ffffff;
  cursor: pointer;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  
  &:hover {
    border-color: #d1d5db;
  }
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.primary ? '#2563eb' : '#e5e7eb'};
  background-color: ${props => props.primary ? '#2563eb' : '#ffffff'};
  color: ${props => props.primary ? '#ffffff' : '#374151'};
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.primary ? '#1d4ed8' : '#f9fafb'};
    border-color: ${props => props.primary ? '#1d4ed8' : '#d1d5db'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    type: 'error',
    content: '',
  });
  const [toast, setToast] = useState(null);

  const guides = [
    { id: 1, title: '메일 발송하는 법', file: 'mail-guide.pdf' },
    { id: 2, title: '엑셀로 주소록 업로드 하기', file: 'excel-upload.pdf' },
    { id: 3, title: '발송 실패 원인 분석', file: 'failure-analysis.pdf' },
  ];

  const faqs = [
    {
      id: 1,
      question: '메일 발송이 실패했을 때 어떻게 해야 하나요?',
      answer: '발송 실패의 경우 시스템 알림 이력을 확인하여 오류 원인을 파악하세요. 주요 원인으로는 SMTP 설정 오류, 수신자 이메일 오류, 일일 발송 한도 초과 등이 있습니다.',
    },
    {
      id: 2,
      question: 'CSV 파일 업로드 시 오류가 발생합니다.',
      answer: 'CSV 파일 형식이 올바른지 확인하세요. 첫 번째 행은 헤더(이름, 이메일, 전화번호)로 구성되어야 하며, UTF-8 인코딩을 사용해야 합니다.',
    },
    {
      id: 3,
      question: '비밀번호를 잊어버렸습니다.',
      answer: '로그인 화면에서 "비밀번호 찾기"를 클릭하거나 시스템 관리자에게 문의하세요. 관리자 계정의 경우 슈퍼 관리자에게 요청하여 초기화할 수 있습니다.',
    },
    {
      id: 4,
      question: '1일 발송 한도를 늘릴 수 있나요?',
      answer: '설정 페이지에서 발송 서버 설정을 수정하여 1일 최대 발송량을 조정할 수 있습니다. 단, SMTP 서버 제공자의 정책에 따라 실제 한도가 제한될 수 있습니다.',
    },
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (filename) => {
    setToast({
      type: 'success',
      title: '다운로드 시작',
      message: `${filename} 다운로드가 시작되었습니다.`,
    });
  };

  const handleView = (title) => {
    setToast({
      type: 'success',
      title: '문서 열기',
      message: `${title} 문서를 새 창에서 열었습니다.`,
    });
  };

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const handleInquiryChange = (field, value) => {
    setInquiryForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitInquiry = () => {
    if (!inquiryForm.content.trim()) {
      setToast({
        type: 'error',
        title: '입력 오류',
        message: '문의 내용을 입력해주세요.',
      });
      return;
    }

    setInquiryForm({ type: 'error', content: '' });
    setToast({
      type: 'success',
      title: '문의 접수 완료',
      message: '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.',
    });
  };

  const handleCheckUpdate = () => {
    setToast({
      type: 'success',
      title: '최신 버전',
      message: '현재 최신 버전을 사용 중입니다.',
    });
  };

  return (
    <PageContainer>
      <PageTitle>도움말</PageTitle>

      <Grid>
        <div>
          <Card>
            <SectionTitle>
              <BookOpen />
              사용자 가이드
            </SectionTitle>
            <GuideList>
              {guides.map(guide => (
                <GuideItem key={guide.id}>
                  <GuideInfo>
                    <GuideIcon>
                      <BookOpen />
                    </GuideIcon>
                    <GuideTitle>{guide.title}</GuideTitle>
                  </GuideInfo>
                  <ActionButtons>
                    <IconButton onClick={() => handleView(guide.title)} title="바로보기">
                      <Eye />
                    </IconButton>
                    <IconButton onClick={() => handleDownload(guide.file)} title="다운로드">
                      <Download />
                    </IconButton>
                  </ActionButtons>
                </GuideItem>
              ))}
            </GuideList>
          </Card>

          <Card>
            <SectionTitle>자주 묻는 질문 (FAQ)</SectionTitle>
            <SearchBox>
              <SearchIcon />
              <SearchInput
                type="text"
                placeholder="질문 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchBox>

            {filteredFAQs.length > 0 ? (
              filteredFAQs.map(faq => (
                <Accordion key={faq.id}>
                  <AccordionHeader
                    isOpen={openFAQ === faq.id}
                    onClick={() => toggleFAQ(faq.id)}
                  >
                    <AccordionTitle>{faq.question}</AccordionTitle>
                    {openFAQ === faq.id ? (
                      <ChevronUp size={20} color="#6b7280" />
                    ) : (
                      <ChevronDown size={20} color="#6b7280" />
                    )}
                  </AccordionHeader>
                  {openFAQ === faq.id && (
                    <AccordionContent>{faq.answer}</AccordionContent>
                  )}
                </Accordion>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                검색 결과가 없습니다.
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <SectionTitle>시스템 정보</SectionTitle>
            <InfoRow>
              <InfoLabel>현재 버전</InfoLabel>
              <InfoValue>v2.5.1</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>기술지원</InfoLabel>
              <InfoValue>02-1234-5678</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>이메일</InfoLabel>
              <InfoValue>support@company.com</InfoValue>
            </InfoRow>
            <Button onClick={handleCheckUpdate} style={{ marginTop: '16px' }}>
              <CheckCircle size={16} />
              업데이트 확인
            </Button>
          </Card>

          <Card>
            <SectionTitle>
              <Send />
              문의하기
            </SectionTitle>
            <FormGroup>
              <Label>문의 유형</Label>
              <Select
                value={inquiryForm.type}
                onChange={(e) => handleInquiryChange('type', e.target.value)}
              >
                <option value="error">오류 신고</option>
                <option value="feature">기능 제안</option>
                <option value="general">일반 문의</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>문의 내용</Label>
              <TextArea
                value={inquiryForm.content}
                onChange={(e) => handleInquiryChange('content', e.target.value)}
                placeholder="문의 내용을 입력하세요..."
              />
            </FormGroup>

            <Button onClick={handleSubmitInquiry} primary>
              <Send size={16} />
              전송
            </Button>
          </Card>
        </div>
      </Grid>

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

export default Help;



